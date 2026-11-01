"""Runs the whole pipeline on a tiny fake week of data in a temp folder."""
import json
import sys
from datetime import date
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import rules as R  # noqa: E402
from pipeline import run  # noqa: E402

TODAY = date(2026, 11, 1)


def make_week(base: Path):
    for d in ("inputs/dnc", "reference", "outputs"):
        (base / d).mkdir(parents=True, exist_ok=True)

    # County file (PIN has NO space, tax Parcel HAS a space -> must still join)
    pd.DataFrame([
        ["R1001001", "1887 DULUTH HWY",    "SMITH JOHN",      "Residential SFR", "R3"],
        ["R1001002", "1860 ATKINSON RD",   "DOE JANE",        "Townhome", "R3"],
        ["R1001003", "50 OAK RIDGE DR",    "ABC HOMES LLC",   "Residential SFR", "R3"],
        ["R1001004", "0 RIVER RD",         "LAND CO",         "Residential Vacant", "R1"],
        ["R1001005", "22 PINE LN",         "BROWN AL",        "Residential SFR", "R3"],
        ["R1001006", "9 ELM CT",           "GREEN BO",        "Mobile Home", "R3"],
        ["R1001007", "4 GONE WAY",         "LEFT LU",         "Residential SFR", "R3"],
        ["R2002001", "300 MAIN ST",        "X",               "Residential SFR", "R3"],
        ["R2002002", "300 MAIN ST",        "Y",               "Residential SFR", "R3"],
    ], columns=R.COUNTY_COLUMNS).to_excel(
        base / "reference" / "2026 Property Ownership.xlsx", index=False)

    pd.DataFrame({
        "Parcel":   ["R1001 001", "R1001 002", "R1001 003", "R1001 004",
                     "R1001 005", "R1001 006", "R1001 007", "R9999 999"],
        "Owner":    ["SMITH JOHN", "DOE JANE", "ABC HOMES LLC", "LAND CO",
                     "BROWN AL", "GREEN BO", "LEFT LU", "GHOST"],
        "Address":  ["1887 Duluth Highway", "1860 Atkinson Road",
                     "50 Oak Ridge Dr", "0 River Rd", "22 Pine Lane",
                     "9 Elm Court", "4 Gone Way", "1 Nowhere St"],
        "MailingAddress": ["PO Box 5", "1860 ATKINSON RD", "1 Corp Plz",
                           "x", "22 Pine Ln", "77 Far Rd", "4 Gone Way", "z"],
        "City": ["Atlanta"] * 8, "State": ["GA"] * 8, "ZIP": ["30301"] * 8,
        "YearsDelinquent": ["3", "3", "5", "2", "1", "3", "4", "2"],
        "TaxYears": [""] * 8, "OldestYear": [""] * 8, "NewestYear": [""] * 8,
        "TotalOwed": ["$4,000", "$9,000", "$1,000", "$50", "$800",
                      "$2,500", "$100", "$1"],
    }).to_csv(base / "inputs" / "tax.csv", index=False)

    pd.DataFrame({
        "Parcel": ["R1001 005", "R1001 007"],
        "Address": ["22 PINE LN", "4 GONE WAY"],
        "Change": ["New this pull", "Left the list"],
        "YearsDelinquent": ["1", "4"],
    }).to_csv(base / "inputs" / "changes.csv", index=False)

    pd.DataFrame({
        "Address": ["1887 DULUTH HWY NW", "300 Main St", "1886 Duluth Hwy"],
        "City": ["Lawrenceville"] * 3, "ZIP": ["30043"] * 3,
        "Owner": ["SMITH", "?", "?"], "Type": ["NOS"] * 3,
        "Sale Date": ["2026-12-01"] * 3,
    }).to_csv(base / "inputs" / "foreclosures.csv", index=False)

    pd.DataFrame({
        "Address": ["9 Elm Ct"], "City": ["Snellville"], "ZIP": ["30078"],
        "CaseNumber": ["CV-1"], "Status": ["Open"], "DateOpened": ["2026-09-01"],
    }).to_csv(base / "inputs" / "code.csv", index=False)

    # BatchData-style results
    pd.DataFrame({
        "Property Address": ["1887 Duluth Hwy", "1860 Atkinson Rd", "9 Elm Ct",
                             "1888 Duluth Hwy"],
        "Mailing Address": ["", "", "", ""],
        "Phone 1": ["(678) 555-0001", "770-555-0002", "212-555-0003", "6785550009"],
        "Phone 1 Type": ["Mobile", "Mobile", "Land", "Mobile"],
        "Phone 2": ["404-555-0004", "", "678-555-0005", ""],
        "Email 1": ["J@X.COM", "", "", ""],
    }).to_csv(base / "inputs" / "batchdata_results.csv", index=False)

    (base / "inputs" / "dnc" / "678_2026-10-25.txt").write_text("6785550005\n")
    (base / "inputs" / "dnc" / "770_2026-10-25.txt").write_text("7709999999\n")
    (base / "inputs" / "dnc" / "404_2026-08-01.txt").write_text("4040000000\n")  # stale
    pd.DataFrame({"phone": ["(770) 555-0002"]}).to_csv(
        base / "reference" / "internal_dnc.csv", index=False)
    pd.DataFrame({"address": ["22 Pine Ln"]}).to_csv(
        base / "reference" / "already_traced.csv", index=False)


def test_full_run(tmp_path):
    make_week(tmp_path)
    res = run(tmp_path, today=TODAY, quiet=True)
    assert res["ok"]
    out = res["out"]

    removed = pd.read_csv(out / "removed_non_sfr.csv", dtype=str)
    assert set(removed["Parcel"]) == {"R1001 004", "R9999 999"}

    overlap = pd.read_csv(out / "overlap_hottest.csv", dtype=str)
    assert list(overlap["Parcel"]) == ["R1001 001", "R1001 006"]   # both 3yr+absentee -> owed DESC

    ranked = pd.read_csv(out / "hot_list_ranked.csv", dtype=str)
    # entity (R1001 003) and 'left the list' (R1001 007) excluded
    assert list(ranked["Parcel"]) == ["R1001 001", "R1001 006", "R1001 002", "R1001 005"]
    ents = pd.read_csv(out / "entity_owners_check.csv", dtype=str)
    assert list(ents["Parcel"]) == ["R1001 003"]

    up = pd.read_csv(out / "skiptrace_upload.csv", dtype=str)
    assert "R1001 005" not in set(up["parcel"])          # already traced
    assert up["parcel"].is_unique

    unmatched = pd.read_csv(out / "unmatched.csv", dtype=str)
    reasons = " ".join(unmatched["reason"])
    assert "ambiguous" in reasons                        # 300 MAIN ST
    assert "1886 Duluth Hwy" in set(unmatched["address"])  # never fuzzy-matched
    assert "1888 Duluth Hwy" in set(unmatched["address"])

    hits = pd.read_csv(out / "dnc_hits.csv", dtype=str)
    assert set(hits["number"]) == {"7705550002", "6785550005"}

    call = json.loads((out / "call_list.json").read_text())
    by_parcel = {c["parcel"]: c for c in call}
    assert list(by_parcel) == ["R1001 001"]   # only one with a callable number
    st = {p["number"]: p["status"] for p in by_parcel["R1001 001"]["phones"]}
    assert st["6785550001"] == R.STATUS_CALLABLE
    assert st["4045550004"] == R.STATUS_NOT_SCRUBBED     # 404 file is stale
    assert by_parcel["R1001 001"]["emails"] == ["j@x.com"]


def test_stops_cleanly_without_inputs(tmp_path):
    (tmp_path / "inputs").mkdir()
    (tmp_path / "reference").mkdir()
    assert run(tmp_path, today=TODAY, quiet=True)["ok"] is False
