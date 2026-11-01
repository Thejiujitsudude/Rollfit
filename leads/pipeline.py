"""
pipeline.py — weekly Gwinnett lead pipeline.

Run:   python pipeline.py
Reads: inputs/, reference/        Writes: outputs/YYYY-MM-DD/

All thresholds / word lists live in rules.py. This file has:
  PART A  small pure helpers (normalize, match, classify)   <- unit tested
  PART B  loaders (inputs, county cache, DNC files)
  PART C  pipeline steps 1-9
  PART D  main()

Matching policy (never broken anywhere in this file):
  1. parcel key first, 2. exact normalized address second, 3. otherwise
  UNMATCHED. No fuzzy matching, no "closest" address, no guessing.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path

import pandas as pd

import rules as R

BASE = Path(__file__).resolve().parent


# =============================================================================
# PART A — PURE HELPERS
# =============================================================================

def clean_header(h) -> str:
    """'Sale Date' / 'sale_date' / 'SALEDATE' -> 'saledate'."""
    return re.sub(r"[^a-z0-9]", "", str(h).lower())


def normalize_address(addr) -> str:
    """Street address -> comparison key.

    uppercase -> punctuation to spaces -> suffixes abbreviated (rules.SUFFIX_MAP)
    -> unit words dropped -> directionals dropped (unless the directional IS
    the street name, e.g. '123 WEST ST').
    """
    if addr is None or (isinstance(addr, float) and pd.isna(addr)):
        return ""
    s = re.sub(r"[^A-Z0-9 ]", " ", str(addr).upper())
    tokens = []
    for t in s.split():
        t = R.SUFFIX_MAP.get(t, t)
        if t:                       # SUFFIX_MAP maps unit words to "" (drop)
            tokens.append(t)

    out = []
    for i, t in enumerate(tokens):
        if t in R.DIRECTIONALS:
            rest = tokens[i + 1:]
            # Keep it only when it is the whole street name: next token is a
            # suffix and nothing but directionals/numbers follow.
            is_street_name = (
                bool(rest) and rest[0] in R.SUFFIX_ABBREVIATIONS
                and all(x in R.DIRECTIONALS or x.isdigit() for x in rest[1:])
                and i > 0
            )
            if not is_street_name:
                continue
        out.append(t)
    return " ".join(out)


def parcel_key(p) -> str:
    """Tax Parcel / county PIN -> join key (all whitespace removed, upper)."""
    if p is None or (isinstance(p, float) and pd.isna(p)):
        return ""
    return re.sub(r"\s+", "", str(p)).upper()


def normalize_class(c) -> str:
    if c is None or (isinstance(c, float) and pd.isna(c)):
        return ""
    return re.sub(r"\s+", " ", str(c)).strip().upper()


def is_keep_class(pcdesc) -> bool:
    """True only for the residential classes in rules.KEEP_CLASSES."""
    return normalize_class(pcdesc) in R.KEEP_CLASSES


def is_entity(owner) -> bool:
    """Owner looks like a company/trust/government (flag only)."""
    if owner is None or (isinstance(owner, float) and pd.isna(owner)):
        return False
    s = re.sub(r"[^A-Z0-9 ]", "", str(owner).upper())   # L.L.C. -> LLC
    s = re.sub(r"\s+", " ", s)
    return bool(R.ENTITY_RE.search(s))


def clean_phone(p) -> str | None:
    """Any phone format -> 10 digits, or None if it isn't a US 10-digit number."""
    if p is None or (isinstance(p, float) and pd.isna(p)):
        return None
    s = str(p).strip()
    if re.fullmatch(r"\d+\.0", s):          # Excel turned it into 6785551234.0
        s = s[:-2]
    d = re.sub(r"\D", "", s)
    if len(d) == 11 and d.startswith("1"):
        d = d[1:]
    return d if len(d) == 10 else None


def is_callable_area(phone) -> bool:
    p = clean_phone(phone)
    return bool(p) and p[:3] in R.CALLABLE_AREA_CODES


def phone_status(phone, internal_dnc: set, registry_dnc: set,
                 fresh_area_codes: set) -> str:
    """One status per number. First rule that applies wins."""
    p = clean_phone(phone)
    if not p:
        return R.STATUS_INVALID
    if p in internal_dnc:
        return R.STATUS_INTERNAL_DNC
    if p in registry_dnc:
        return R.STATUS_REGISTRY_DNC
    if p[:3] not in R.CALLABLE_AREA_CODES:
        return R.STATUS_OUT_OF_AREA
    if R.REQUIRE_FRESH_DNC and p[:3] not in fresh_area_codes:
        return R.STATUS_NOT_SCRUBBED
    return R.STATUS_CALLABLE


def to_money(x) -> float:
    try:
        return float(re.sub(r"[^0-9.\-]", "", str(x)) or 0)
    except ValueError:
        return 0.0


def to_int(x) -> int:
    try:
        return int(float(re.sub(r"[^0-9.\-]", "", str(x)) or 0))
    except ValueError:
        return 0


class AddressIndex:
    """Exact normalized-address -> parcel-key lookup.

    If one normalized address belongs to MORE than one parcel anywhere in the
    county, it is ambiguous and never matched (no guessing which one).
    """

    def __init__(self):
        self._map: dict[str, set] = defaultdict(set)

    def add(self, key, address):
        k, a = parcel_key(key), normalize_address(address)
        if k and a:
            self._map[a].add(k)

    def lookup(self, address):
        """-> (parcel_key or None, reason)"""
        a = normalize_address(address)
        if not a:
            return None, "blank address"
        keys = self._map.get(a)
        if not keys:
            return None, "no exact address match"
        if len(keys) > 1:
            return None, f"address belongs to {len(keys)} parcels (ambiguous)"
        return next(iter(keys)), "address"


NOT_ON_LIST = "address found, but parcel not on kept tax list"


def match_record(parcel, address, valid_keys: set, index: AddressIndex):
    """Parcel first, then exact address. -> (key or None, how/reason).

    valid_keys = parcels that count as a match (e.g. this week's kept tax list).
    """
    k = parcel_key(parcel)
    if k:
        if k in valid_keys:
            return k, "parcel"
        # A parcel was given but isn't on the list: fall through to address.
    key, how = index.lookup(address)
    if key is None:
        return None, how
    if key not in valid_keys:
        return None, NOT_ON_LIST
    return key, how


# =============================================================================
# PART B — LOADERS
# =============================================================================

def read_csv_any(path: Path) -> pd.DataFrame:
    """Read every column as text (keeps leading zeros / parcel spacing)."""
    for enc in ("utf-8-sig", "latin-1"):
        try:
            return pd.read_csv(path, dtype=str, keep_default_na=False,
                               encoding=enc)
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Can't read {path}")


def standardize_columns(df: pd.DataFrame, wanted: list[str]) -> pd.DataFrame:
    """Rename columns that match `wanted` (ignoring case/spaces) to the
    canonical spelling. Other columns are left alone."""
    lookup = {clean_header(w): w for w in wanted}
    return df.rename(columns={c: lookup[clean_header(c)]
                              for c in df.columns if clean_header(c) in lookup})


def missing_columns(df: pd.DataFrame, wanted: list[str]) -> list[str]:
    have = {clean_header(c) for c in df.columns}
    return [w for w in wanted if clean_header(w) not in have]


def detect_skip_columns(df: pd.DataFrame) -> dict:
    """Find phone / email / address / parcel columns in a skip-trace file."""
    phones, emails, address, parcel = [], [], None, None
    for c in df.columns:
        name = str(c)
        vals = [v for v in df[c].astype(str) if v.strip()]
        if R.SKIP_EMAIL_COL_RE.search(name) and not R.SKIP_NOT_A_VALUE_RE.search(name):
            emails.append(c)
        elif R.SKIP_PHONE_COL_RE.search(name) and not R.SKIP_NOT_A_VALUE_RE.search(name):
            ok = sum(1 for v in vals if clean_phone(v))
            if vals and ok / len(vals) >= R.PHONE_VALUE_SHARE:
                phones.append(c)
        elif (address is None and R.SKIP_ADDRESS_COL_RE.search(name)
              and not R.SKIP_ADDRESS_EXCLUDE_RE.search(name)):
            address = c
        elif parcel is None and R.SKIP_PARCEL_COL_RE.search(clean_header(name)):
            parcel = c
    return {"phones": phones, "emails": emails, "address": address,
            "parcel": parcel}


def classify_input(df: pd.DataFrame) -> str | None:
    """Which input is this CSV? Decided by its columns, not its filename."""
    for kind in ("tax_snapshot", "tax_changes", "code_violations",
                 "foreclosures"):
        if not missing_columns(df, R.REQUIRED_COLUMNS[kind]):
            return kind
    if detect_skip_columns(df)["phones"]:
        return "skip_trace"
    return None


def load_inputs(inputs_dir: Path, log) -> dict:
    """Load every CSV in inputs/ and sort it into the right bucket."""
    found = defaultdict(list)          # kind -> [(path, df)]
    for path in sorted(inputs_dir.glob("*.csv")):
        df = read_csv_any(path)
        kind = classify_input(df)
        if kind is None:
            # Tell the user which known type it was closest to.
            best = min(R.REQUIRED_COLUMNS,
                       key=lambda k: len(missing_columns(df, R.REQUIRED_COLUMNS[k])))
            miss = missing_columns(df, R.REQUIRED_COLUMNS[best])
            log(f"  ? {path.name}: NOT RECOGNIZED ({len(df)} rows). "
                f"Closest = {best}, missing columns: {', '.join(miss)}")
            continue
        found[kind].append((path, df))

    data = {}
    for kind, items in found.items():
        if kind == "skip_trace":       # several skip-trace files are fine
            data[kind] = items
            for p, df in items:
                log(f"  + {p.name}: skip-trace results, {len(df)} rows")
            continue
        items.sort(key=lambda x: x[0].stat().st_mtime, reverse=True)
        path, df = items[0]
        if len(items) > 1:
            log(f"  ! {len(items)} files look like {kind}; using newest "
                f"({path.name}). Move old ones out of inputs/.")
        data[kind] = standardize_columns(df, R.REQUIRED_COLUMNS[kind])
        log(f"  + {path.name}: {kind}, {len(df)} rows")
    return data


def load_county(reference_dir: Path, log) -> pd.DataFrame | None:
    """Load the assessor workbook once, then reuse a pickle cache.

    Cache is rebuilt automatically when the .xlsx changes (size/mtime).
    """
    xlsx = sorted(reference_dir.glob("*Property Ownership*.xlsx"))
    if not xlsx:
        return None
    src = xlsx[-1]
    cache_dir = reference_dir / ".cache"
    cache = cache_dir / (src.stem + ".pkl")
    stamp = f"{src.stat().st_size}-{int(src.stat().st_mtime)}"
    stamp_file = cache_dir / (src.stem + ".stamp")
    if cache.exists() and stamp_file.exists() and stamp_file.read_text() == stamp:
        df = pd.read_pickle(cache)
        log(f"  + {src.name}: {len(df):,} rows (from cache)")
        return df

    log(f"  … reading {src.name} (first time is slow; cached after)")
    df = pd.read_excel(src, dtype=str)
    df = standardize_columns(df, R.COUNTY_COLUMNS)
    miss = missing_columns(df, R.COUNTY_COLUMNS)
    if miss:
        log(f"  ! county file missing columns: {', '.join(miss)}")
    df = df[[c for c in R.COUNTY_COLUMNS if c in df.columns]].fillna("")
    df["key"] = df["PIN"].map(parcel_key)
    cache_dir.mkdir(exist_ok=True)
    df.to_pickle(cache)
    stamp_file.write_text(stamp)
    log(f"  + {src.name}: {len(df):,} rows (cached)")
    return df


def load_already_traced(reference_dir: Path):
    """-> (set of parcel keys, set of normalized addresses)."""
    path = reference_dir / "already_traced.csv"
    if not path.exists():
        return set(), set(), False
    df = read_csv_any(path)
    keys, addrs = set(), set()
    cols = detect_skip_columns(df)
    addr_col = cols["address"] or (df.columns[0] if len(df.columns) else None)
    if cols["parcel"]:
        keys = {parcel_key(v) for v in df[cols["parcel"]] if parcel_key(v)}
    if addr_col is not None:
        addrs = {normalize_address(v) for v in df[addr_col] if normalize_address(v)}
    return keys, addrs, True


def load_internal_dnc(reference_dir: Path):
    """Every 10-digit number in internal_dnc.csv (any column)."""
    path = reference_dir / "internal_dnc.csv"
    if not path.exists():
        return set(), False
    df = read_csv_any(path)
    nums = {clean_phone(v) for col in df.columns for v in df[col]}
    # a file with no header row: the header itself may be a number
    nums |= {clean_phone(c) for c in df.columns}
    nums.discard(None)
    return nums, True


def load_dnc_registry(dnc_dir: Path, today: date, log):
    """Read registry files (one per area code) from inputs/dnc/.

    Name files like  404_2026-10-28.txt  so the download date is recorded.
    If no date is in the name, the file's modified date is used.
    -> (set of numbers, list of file info dicts, set of FRESH area codes)
    """
    numbers, info, fresh = set(), [], set()
    if not dnc_dir.exists():
        return numbers, info, fresh
    for path in sorted(dnc_dir.iterdir()):
        if path.name.startswith(".") or path.suffix.lower() not in (".txt", ".csv"):
            continue
        nums = set()
        with open(path, encoding="utf-8", errors="ignore") as fh:
            for line in fh:
                for chunk in re.split(r"[,;\t]", line):
                    p = clean_phone(chunk)
                    if p:
                        nums.add(p)
        m = re.search(r"(\d{4}-\d{2}-\d{2})", path.name)
        if m:
            dl = datetime.strptime(m.group(1), "%Y-%m-%d").date()
            how = "filename"
        else:
            dl = datetime.fromtimestamp(path.stat().st_mtime).date()
            how = "file modified date"
        m2 = re.match(r"(\d{3})(?!\d)", path.name)
        code = m2.group(1) if m2 else (
            Counter(n[:3] for n in nums).most_common(1)[0][0] if nums else "?")
        age = (today - dl).days
        is_fresh = age <= R.DNC_MAX_AGE_DAYS
        if is_fresh:
            fresh.add(code)
        else:
            log(f"  !! DNC file {path.name} is {age} days old "
                f"(limit {R.DNC_MAX_AGE_DAYS}). Re-download it.")
        numbers |= nums
        info.append({"file": path.name, "area_code": code,
                     "download_date": dl.isoformat(), "date_from": how,
                     "age_days": age, "numbers": len(nums), "fresh": is_fresh})
    return numbers, info, fresh


# =============================================================================
# PART C — PIPELINE STEPS
# =============================================================================

def prep_tax(tax: pd.DataFrame) -> pd.DataFrame:
    """Add computed columns to the tax snapshot."""
    t = tax.copy()
    t["key"] = t["Parcel"].map(parcel_key)
    t["years"] = t["YearsDelinquent"].map(to_int)
    t["owed"] = t["TotalOwed"].map(to_money)
    t["entity"] = t["Owner"].map(is_entity)

    def absentee(row):
        mail = normalize_address(row["MailingAddress"])
        if not mail:
            return None                 # unknown — ranks like "not absentee"
        return mail != normalize_address(row["Address"])
    t["absentee"] = t.apply(absentee, axis=1)
    # City/State/ZIP are the OWNER'S MAILING address (never the property).
    t["owner_mailing"] = (t["MailingAddress"].str.strip() + ", " +
                          t["City"].str.strip() + ", " + t["State"].str.strip()
                          + " " + t["ZIP"].str.strip()).str.strip(" ,")
    return t


def step2_filter_classes(tax: pd.DataFrame, county: pd.DataFrame):
    """Join tax parcels to county class. -> (kept, removed)."""
    cls = county.drop_duplicates("key").set_index("key")
    t = tax.copy()
    t["PCDESC"] = t["key"].map(cls["PCDESC"]).fillna("")
    t["PROPCLAS_DESC"] = t["key"].map(cls.get("PROPCLAS_DESC", pd.Series(dtype=str))).fillna("")
    t["in_county"] = t["key"].isin(cls.index)
    t["keep"] = t["PCDESC"].map(is_keep_class) & t["in_county"]

    removed = t[~t["keep"]].copy()
    removed["reason"] = removed.apply(
        lambda r: "parcel not found in county file (class unknown)"
        if not r["in_county"] else f"class: {r['PCDESC'] or '(blank)'}", axis=1)
    return t[t["keep"]].copy(), removed


def rank_sort(df: pd.DataFrame) -> pd.DataFrame:
    """Years delinquent DESC, absentee first, TotalOwed DESC."""
    d = df.copy()
    d["_abs"] = d["absentee"].map(lambda v: 1 if v is True else 0)
    d = d.sort_values(["years", "_abs", "owed", "key"],
                      ascending=[False, False, False, True])
    return d.drop(columns="_abs")


def step3_overlap(kept, foreclosures, code, index, unmatched):
    """Tax-delinquent parcels that are ALSO in foreclosure or code violations."""
    valid = set(kept.loc[kept["change_norm"] != R.CHANGE_LEFT, "key"])
    hits = defaultdict(lambda: {"sources": [], "details": []})
    for name, df, detail_cols in (
            ("foreclosure", foreclosures, ["Type", "Sale Date"]),
            ("code violation", code, ["CaseNumber", "Status", "DateOpened"])):
        if df is None:
            continue
        pcol = next((c for c in df.columns
                     if R.SKIP_PARCEL_COL_RE.search(clean_header(c))), None)
        for _, row in df.iterrows():
            key, how = match_record(row[pcol] if pcol else "",
                                    row["Address"], valid, index)
            if key is None:
                if how != NOT_ON_LIST:   # matched a parcel that isn't delinquent = fine
                    unmatched.append({"source": name, "address": row["Address"],
                                      "city": row.get("City", ""),
                                      "reason": how})
                continue
            if name not in hits[key]["sources"]:
                hits[key]["sources"].append(name)
            hits[key]["details"].append(
                f"{name}: " + ", ".join(f"{c} {row[c]}" for c in detail_cols
                                        if str(row.get(c, "")).strip()))
    o = kept[kept["key"].isin(hits)].copy()
    o["source"] = o["key"].map(lambda k: " + ".join(hits[k]["sources"]))
    o["details"] = o["key"].map(lambda k: " | ".join(hits[k]["details"]))
    return rank_sort(o)


def step4_rank(kept, changes):
    """-> (ranked hot list w/o entities, entity check list, kept w/ Change)."""
    k = kept.copy()
    if changes is not None:
        ch = changes.copy()
        ch["key"] = ch["Parcel"].map(parcel_key)
        ch = ch.drop_duplicates("key").set_index("key")
        k["Change"] = k["key"].map(ch["Change"]).fillna("")
    else:
        k["Change"] = ""
    k["change_norm"] = k["Change"].map(normalize_class)
    active = k[k["change_norm"] != R.CHANGE_LEFT]
    ranked = rank_sort(active[~active["entity"]]).reset_index(drop=True)
    ranked["rank"] = ranked.index + 1
    entities = rank_sort(active[active["entity"]])
    return ranked, entities, k


UPLOAD_COLUMNS = ["batch", "why", "parcel", "address", "property type", "owner",
                  "owner mailing address", "years delinquent", "owed",
                  "absentee", "entity flag"]


def lead_row(r, batch, why):
    return {
        "batch": batch, "why": why, "parcel": r["Parcel"],
        "address": r["Address"], "property type": r["PCDESC"],
        "owner": r["Owner"], "owner mailing address": r["owner_mailing"],
        "years delinquent": r["years"], "owed": round(r["owed"], 2),
        "absentee": {True: "Y", False: "N"}.get(r["absentee"], "?"),
        "entity flag": "Y" if r["entity"] else "N",
    }


def step5_skiptrace(ranked, overlap, kept, traced_keys, traced_addrs, batch):
    """Top N hot + overlap + new-this-pull, minus already traced, deduped."""
    why = defaultdict(list)
    for _, r in overlap.iterrows():
        why[r["key"]].append(f"overlap ({r['source']})")
    for _, r in ranked.head(R.TOP_N_HOT).iterrows():
        why[r["key"]].append(f"hot #{r['rank']}")
    for _, r in kept[kept["change_norm"] == R.CHANGE_NEW].iterrows():
        why[r["key"]].append("new this pull")

    by_key = kept.drop_duplicates("key").set_index("key")
    rows, skipped = [], 0
    for key, reasons in why.items():               # dict = no duplicates
        r = by_key.loc[key]
        if key in traced_keys or normalize_address(r["Address"]) in traced_addrs:
            skipped += 1
            continue
        rows.append(lead_row(r, batch, "; ".join(reasons)))
    return pd.DataFrame(rows, columns=UPLOAD_COLUMNS), skipped


def step6_merge_skip(skip_items, kept, index, internal, registry, fresh,
                     unmatched):
    """Attach phones/emails to parcels. -> {key: {"phones": [...], "emails": [...]}}"""
    valid = set(kept["key"])
    contacts = defaultdict(lambda: {"phones": [], "emails": []})
    for path, df in skip_items:
        cols = detect_skip_columns(df)
        if cols["address"] is None and cols["parcel"] is None:
            unmatched.append({"source": f"skip trace {path.name}", "address": "",
                              "city": "", "reason": "no address column found"})
            continue
        for _, row in df.iterrows():
            key, how = match_record(row[cols["parcel"]] if cols["parcel"] else "",
                                    row[cols["address"]] if cols["address"] else "",
                                    valid, index)
            if key is None:
                unmatched.append({"source": f"skip trace {path.name}",
                                  "address": row[cols["address"]] if cols["address"] else "",
                                  "city": "", "reason": how})
                continue
            c = contacts[key]
            seen = {p["number"] for p in c["phones"]}
            for pc in cols["phones"]:
                p = clean_phone(row[pc])
                if p and p not in seen:
                    seen.add(p)
                    st = phone_status(p, internal, registry, fresh)
                    c["phones"].append({"number": p, "status": st,
                                        "callable": st == R.STATUS_CALLABLE})
            for ec in cols["emails"]:
                e = str(row[ec]).strip().lower()
                if "@" in e and e not in c["emails"]:
                    c["emails"].append(e)
    return contacts


# =============================================================================
# PART D — MAIN
# =============================================================================

def run(base: Path = BASE, today: date | None = None, quiet=False) -> dict:
    today = today or date.today()
    batch = today.isoformat()
    out = base / "outputs" / batch
    out.mkdir(parents=True, exist_ok=True)
    lines = []

    def log(msg=""):
        lines.append(msg)
        if not quiet:
            print(msg)

    # ---- STEP 1: load + validate ------------------------------------------
    log(f"=== Lead pipeline {batch} ===")
    log("STEP 1  Loading inputs/")
    data = load_inputs(base / "inputs", log)
    log("        Loading reference/")
    county = load_county(base / "reference", log)
    traced_keys, traced_addrs, has_traced = load_already_traced(base / "reference")
    internal, has_internal = load_internal_dnc(base / "reference")
    log(f"  + already_traced.csv: {len(traced_addrs) + len(traced_keys)} entries"
        if has_traced else "  - already_traced.csv: not found (nothing excluded)")
    log(f"  + internal_dnc.csv: {len(internal)} numbers"
        if has_internal else "  - internal_dnc.csv: not found")
    registry, dnc_info, fresh = load_dnc_registry(base / "inputs" / "dnc", today, log)
    for f in dnc_info:
        log(f"  + DNC {f['file']}: area {f['area_code']}, {f['numbers']:,} numbers, "
            f"downloaded {f['download_date']} ({f['age_days']} days old)")

    if "tax_snapshot" not in data or county is None:
        log("\nSTOP: need a tax snapshot CSV in inputs/ AND "
            "'2026 Property Ownership.xlsx' in reference/.")
        (out / "summary.txt").write_text("\n".join(lines))
        return {"ok": False}
    for opt in ("tax_changes", "foreclosures", "code_violations"):
        if opt not in data:
            log(f"  - no {opt} file found (step skipped)")

    unmatched: list[dict] = []
    counts = {}

    # ---- STEP 2: county class filter --------------------------------------
    tax = prep_tax(data["tax_snapshot"])
    kept, removed = step2_filter_classes(tax, county)
    cols = ["Parcel", "Address", "Owner", "PCDESC", "PROPCLAS_DESC", "reason"]
    removed[cols].to_csv(out / "removed_non_sfr.csv", index=False)
    for _, r in removed[~removed["in_county"]].iterrows():
        unmatched.append({"source": "tax snapshot", "address": r["Address"],
                          "city": "", "reason": f"parcel {r['Parcel']} not in county file"})
    counts["removed_non_sfr.csv"] = len(removed)
    log(f"STEP 2  {len(tax)} tax parcels -> kept {len(kept)}, removed {len(removed)}")

    # Address index = every county parcel + every kept tax parcel.
    index = AddressIndex()
    for k, a in zip(county["key"], county["PROPERTYSTREET"]):
        index.add(k, a)
    for k, a in zip(kept["key"], kept["Address"]):
        index.add(k, a)

    # ---- STEP 4 first (needs Change column), then STEP 3 -------------------
    ranked, entities, kept = step4_rank(kept, data.get("tax_changes"))
    overlap = step3_overlap(kept, data.get("foreclosures"),
                            data.get("code_violations"), index, unmatched)
    ocols = ["Parcel", "Address", "source", "details", "years", "owed",
             "absentee", "entity"]
    overlap[ocols].rename(columns={"years": "years_delinquent",
                                   "entity": "entity_flag"}).to_csv(
        out / "overlap_hottest.csv", index=False)
    counts["overlap_hottest.csv"] = len(overlap)
    log(f"STEP 3  overlap (tax + foreclosure/code): {len(overlap)}")

    rcols = ["rank", "Parcel", "Address", "PCDESC", "Owner", "owner_mailing",
             "years", "owed", "absentee", "Change"]
    ranked[rcols].to_csv(out / "hot_list_ranked.csv", index=False)
    entities[[c for c in rcols if c != "rank"]].to_csv(
        out / "entity_owners_check.csv", index=False)
    counts["hot_list_ranked.csv"] = len(ranked)
    counts["entity_owners_check.csv"] = len(entities)
    left = (kept["change_norm"] == R.CHANGE_LEFT).sum()
    log(f"STEP 4  ranked hot list: {len(ranked)}  | entity owners set aside: "
        f"{len(entities)}  | 'left the list' skipped: {left}")

    # ---- STEP 5: skip-trace upload ----------------------------------------
    upload, skipped = step5_skiptrace(ranked, overlap, kept, traced_keys,
                                      traced_addrs, batch)
    upload.to_csv(out / "skiptrace_upload.csv", index=False)
    counts["skiptrace_upload.csv"] = len(upload)
    log(f"STEP 5  skip-trace upload: {len(upload)} (already traced, removed: {skipped})")

    # ---- STEP 6: merge skip-trace results ---------------------------------
    contacts = {}
    if data.get("skip_trace"):
        contacts = step6_merge_skip(data["skip_trace"], kept, index, internal,
                                    registry, fresh, unmatched)
        n_ph = sum(len(c["phones"]) for c in contacts.values())
        st = Counter(p["status"] for c in contacts.values() for p in c["phones"])
        log(f"STEP 6  phones merged onto {len(contacts)} parcels ({n_ph} numbers)")
        for s, n in st.most_common():
            log(f"          {s}: {n}")
    else:
        log("STEP 6  no skip-trace results in inputs/ (skipped)")

    by_key = kept.drop_duplicates("key").set_index("key")
    if contacts:
        rows = []
        for key, c in contacts.items():
            r = by_key.loc[key]
            for p in c["phones"] or [{"number": "", "status": "", "callable": False}]:
                rows.append({"parcel": r["Parcel"], "address": r["Address"],
                             "owner": r["Owner"], "phone": p["number"],
                             "status": p["status"], "emails": "; ".join(c["emails"])})
        pd.DataFrame(rows).to_csv(out / "leads_with_phones.csv", index=False)
        counts["leads_with_phones.csv"] = len(rows)

    # ---- STEP 7: DNC hits --------------------------------------------------
    hits = [{"number": p["number"], "list": p["status"], "address": by_key.loc[k, "Address"],
             "owner": by_key.loc[k, "Owner"], "parcel": by_key.loc[k, "Parcel"]}
            for k, c in contacts.items() for p in c["phones"]
            if p["status"] in (R.STATUS_REGISTRY_DNC, R.STATUS_INTERNAL_DNC)]
    pd.DataFrame(hits, columns=["number", "address", "owner", "parcel", "list"]
                 ).to_csv(out / "dnc_hits.csv", index=False)
    counts["dnc_hits.csv"] = len(hits)
    (out / "dnc_status.json").write_text(json.dumps(
        {"run_date": batch, "max_age_days": R.DNC_MAX_AGE_DAYS,
         "files": dnc_info}, indent=2))
    if not dnc_info:
        log("STEP 7  !! no DNC registry files in inputs/dnc/ — "
            "NO number is marked callable until you add them")
    else:
        log(f"STEP 7  DNC scrub: {len(hits)} hits | fresh area codes: "
            f"{', '.join(sorted(fresh)) or 'NONE'}")
        missing = R.CALLABLE_AREA_CODES - fresh
        if missing:
            log(f"        !! no current registry file for: {', '.join(sorted(missing))}"
                " (those numbers are not callable)")

    # ---- STEP 8: call list -------------------------------------------------
    overlap_keys = list(overlap["key"])
    order = overlap_keys + [k for k in rank_sort(kept)["key"] if k not in set(overlap_keys)]
    hot_rank = dict(zip(ranked["key"], ranked["rank"]))
    osrc = dict(zip(overlap["key"], overlap["source"]))
    call = []
    for key in order:
        c = contacts.get(key)
        if not c or not any(p["callable"] for p in c["phones"]):
            continue
        r = by_key.loc[key]
        call.append({
            "order": len(call) + 1,
            "parcel": r["Parcel"], "address": r["Address"], "owner": r["Owner"],
            "property_type": r["PCDESC"],
            "overlap": osrc.get(key, ""),
            "hot_rank": int(hot_rank[key]) if key in hot_rank else None,
            "years_delinquent": int(r["years"]), "owed": round(float(r["owed"]), 2),
            "absentee": None if r["absentee"] is None or pd.isna(r["absentee"])
            else bool(r["absentee"]),
            "entity": bool(r["entity"]),
            "phones": c["phones"], "emails": c["emails"],
        })
    (out / "call_list.json").write_text(json.dumps(call, indent=2))
    counts["call_list.json"] = len(call)
    log(f"STEP 8  call list: {len(call)} callable leads")

    # ---- STEP 9: summary ---------------------------------------------------
    pd.DataFrame(unmatched, columns=["source", "address", "city", "reason"]
                 ).to_csv(out / "unmatched.csv", index=False)
    counts["unmatched.csv"] = len(unmatched)
    log(f"\nSTEP 9  SUMMARY  ->  {out}")
    for name, n in counts.items():
        log(f"  {name:<28} {n:>6}")
    if unmatched:
        log("  Unmatched by reason:")
        for (src, why), n in Counter((u["source"], u["reason"]) for u in unmatched).most_common():
            log(f"    {n:>5}  {src}: {why}")
    (out / "summary.txt").write_text("\n".join(lines) + "\n")
    return {"ok": True, "out": out, "counts": counts}


if __name__ == "__main__":
    result = run()
    sys.exit(0 if result["ok"] else 1)
