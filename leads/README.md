# Gwinnett Lead Pipeline

One command turns the weekly Muse lead CSVs into clean, ranked, DNC-scrubbed outputs.

```bash
cd leads
pip install -r requirements.txt     # once
python pipeline.py                  # every week
python -m pytest -q                 # run the tests
```

## Weekly routine (10 min)

1. Move last week's files out of `inputs/` (pipeline uses the newest file of each type and warns if there are extras).
2. Drop this week's Muse CSVs into `inputs/`. **File names don't matter.** Each file is recognized by its columns.
3. (Every 31 days or less) Download fresh DNC files into `inputs/dnc/`, named like `404_2026-10-28.txt`.
4. Run `python pipeline.py`.
5. Upload `outputs/<date>/skiptrace_upload.csv` to BatchData or REISkip.
6. Drop the skip-trace results CSV into `inputs/` and run `python pipeline.py` again. That run builds `call_list.json`.

## Inputs (`inputs/`)

| File | Recognized by columns | Required? |
|---|---|---|
| Tax snapshot | Parcel, Owner, Address, MailingAddress, City, State, ZIP, YearsDelinquent, TaxYears, OldestYear, NewestYear, TotalOwed | **Yes** |
| Tax change report | Parcel, Address, Change, YearsDelinquent | No |
| Foreclosure leads | Address, City, ZIP, Owner, Type, Sale Date | No |
| Code violations | Address, City, ZIP, CaseNumber, Status, DateOpened | No |
| Skip-trace results (BatchData / REISkip) | any column with "phone"/"mobile"/"cell" holding phone numbers + a property address column | No (you can have several) |
| `dnc/*.txt` | one file per area code from telemarketing.donotcall.gov | No, but **nothing is callable without them** |

Column names are matched ignoring case and spaces (`Sale Date` = `sale_date`).

> **City/State/ZIP in the tax snapshot are the owner's MAILING address.** They are only used in the "owner mailing address" column, never to locate the property.

## Reference (`reference/`)

| File | What it is |
|---|---|
| `2026 Property Ownership.xlsx` | Gwinnett assessor file (PIN, PROPERTYSTREET, OWNERNAME1, PCDESC, PROPCLAS_DESC). The first run takes a minute or two and saves a cache in `reference/.cache/`. Later runs are fast. Drop in a new workbook and the cache rebuilds by itself. |
| `already_traced.csv` | Addresses you already have phones for (needs a column with "address" in the name, optionally a parcel column). These are left out of the skip-trace upload. |
| `internal_dnc.csv` | People who told you to stop calling. Any column, any phone format. **These numbers are never callable**, whatever the registry says. |

## Outputs (`outputs/YYYY-MM-DD/`)

| File | What's in it |
|---|---|
| `summary.txt` | Same summary that prints on screen |
| `removed_non_sfr.csv` | Parcels dropped because the county class isn't a house (or the parcel isn't in the county file), with the reason |
| `overlap_hottest.csv` | **Hottest leads:** tax delinquent AND foreclosure or code violation |
| `hot_list_ranked.csv` | Remaining parcels ranked: years delinquent ↓, absentee first, owed ↓. Entity owners and "Left the list" are excluded |
| `entity_owners_check.csv` | LLC/trust/bank/church/etc. owners, set aside for you to review |
| `skiptrace_upload.csv` | Top N hot + overlap + new-this-pull, minus already traced, no duplicates. Column `why` says why each one is in it |
| `leads_with_phones.csv` | One row per phone, with its status (only after skip-trace results are in `inputs/`) |
| `dnc_hits.csv` | Every number found on the registry or your internal DNC (number, address, owner, list) |
| `dnc_status.json` | Which DNC files were used, their download date and age |
| `call_list.json` | **Callable leads only**, in ranked order (overlap first). Every phone has a status; dial only `"callable": true` |
| `unmatched.csv` | Everything that couldn't be matched exactly, with the reason |

## Rules (all in `rules.py`)

- **Property type = county class (PCDESC).** Kept: Residential SFR, Townhome, Residential Condominium, Residential Duplex, Res Percentaged Dwelling, Mobile Home. Everything else is removed.
- **Entity flag:** LLC, INC, CORP, LP, LTD, TRUST, COMPANY, PROPERTIES, HOLDINGS, BANK, CHURCH, ASSOCIATION, AUTHORITY, STATE OF, COUNTY, CITY OF, PARTNERS, INVESTMENT. These are flagged, never deleted.
- **Absentee:** normalized MailingAddress ≠ normalized property Address. A blank mailing address shows as `?`.
- **Address normalization:** uppercase, no punctuation, suffixes shortened (DRIVE→DR, HIGHWAY→HWY…), unit words dropped (`#5` = `UNIT 5` = `5`), directionals dropped (except when the directional *is* the street name, like `123 WEST ST`).
- **No fuzzy matching.** Match by parcel first, then exact normalized address. If one address belongs to more than one parcel in the county, it's marked ambiguous and **not matched**.
- **Phone status** (the first one that applies wins): invalid → internal DNC → registry DNC → out of area (not 404/470/678/770/762) → not scrubbed (no registry file for that area code from the last 31 days) → **callable**.
- `TOP_N_HOT` (default 100) controls how many hot-list parcels go to skip trace.

## Privacy

`inputs/`, `reference/` and `outputs/` are in `.gitignore`. Owner names and phone numbers never go to GitHub.
