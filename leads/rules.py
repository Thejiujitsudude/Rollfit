"""
rules.py — every threshold, word list, regex and area code the pipeline uses.

Change behavior HERE, not in pipeline.py. Each setting has a comment saying
what it controls.
"""
import re

# ---------------------------------------------------------------------------
# 1. PROPERTY CLASS FILTER (county PCDESC column)
# ---------------------------------------------------------------------------
# Property type comes ONLY from the county class, never from how the address
# looks. Compared case-insensitively with extra spaces collapsed.
KEEP_CLASSES = {
    "RESIDENTIAL SFR",
    "TOWNHOME",
    "RESIDENTIAL CONDOMINIUM",
    "RESIDENTIAL DUPLEX",
    "RES PERCENTAGED DWELLING",
    "MOBILE HOME",
}
# Everything not in KEEP_CLASSES is removed (Residential Vacant, HOA Vacant
# Land, Residual Land, commercial, exempt, apartments, ...).

# ---------------------------------------------------------------------------
# 2. ENTITY OWNER FLAG (flag only — never removes a lead by itself)
# ---------------------------------------------------------------------------
# Matched as whole words after punctuation is stripped ("L.L.C." -> "LLC").
# Small plural/variant forms are allowed (TRUSTEE, HOLDING, INVESTMENTS...).
ENTITY_PATTERNS = [
    r"LLC", r"INC", r"CORP(ORATION)?", r"LP", r"LTD",
    r"TRUST(S|EE|EES)?", r"COMPANY", r"PROPERTIES", r"HOLDINGS?",
    r"BANK", r"CHURCH", r"ASSOCIATION", r"AUTHORITY",
    r"STATE OF", r"COUNTY", r"CITY OF", r"PARTNERS(HIP)?", r"INVESTMENTS?",
]
ENTITY_RE = re.compile(r"\b(" + "|".join(ENTITY_PATTERNS) + r")\b")

# ---------------------------------------------------------------------------
# 3. PHONES / AREA CODES
# ---------------------------------------------------------------------------
# Only these area codes are dialed. Anything else = "out of area, park".
CALLABLE_AREA_CODES = {"404", "470", "678", "770", "762"}

# Phone status labels (in priority order — the first one that applies wins).
STATUS_INVALID = "invalid number"
STATUS_INTERNAL_DNC = "internal DNC - never call"
STATUS_REGISTRY_DNC = "registry DNC"
STATUS_OUT_OF_AREA = "out of area, park"
STATUS_NOT_SCRUBBED = "not scrubbed - no current registry file"
STATUS_CALLABLE = "callable"

# Federal rule: registry data must be refreshed at least every 31 days.
DNC_MAX_AGE_DAYS = 31
# If True, a phone whose area-code registry file is missing or older than
# DNC_MAX_AGE_DAYS is NOT callable ("not scrubbed"). Leave True for safety.
REQUIRE_FRESH_DNC = True

# ---------------------------------------------------------------------------
# 4. RANKING / SKIP-TRACE BATCH
# ---------------------------------------------------------------------------
TOP_N_HOT = 100           # how many hot-list parcels go into the skip-trace file
CHANGE_NEW = "NEW THIS PULL"
CHANGE_LEFT = "LEFT THE LIST"   # these parcels are never ranked or traced

# ---------------------------------------------------------------------------
# 5. ADDRESS NORMALIZATION
# ---------------------------------------------------------------------------
# Whole-word replacements applied after uppercase + punctuation strip.
SUFFIX_MAP = {
    "ALLEY": "ALY", "AVENUE": "AVE", "AV": "AVE", "BEND": "BND",
    "BOULEVARD": "BLVD", "BLV": "BLVD", "BRANCH": "BR", "BRIDGE": "BRG",
    "BROOK": "BRK", "CIRCLE": "CIR", "CIRC": "CIR", "CLOSE": "CLS",
    "COMMON": "CMN", "COMMONS": "CMNS", "COURT": "CT", "CRT": "CT",
    "COVE": "CV", "CREEK": "CRK", "CRESCENT": "CRES", "CROSSING": "XING",
    "CRSG": "XING", "DRIVE": "DR", "DRV": "DR", "ESTATES": "ESTS",
    "EXPRESSWAY": "EXPY", "EXTENSION": "EXT", "FERRY": "FRY", "FIELD": "FLD",
    "FIELDS": "FLDS", "FOREST": "FRST", "FREEWAY": "FWY", "GLEN": "GLN",
    "GREEN": "GRN", "GROVE": "GRV", "HARBOR": "HBR", "HEIGHTS": "HTS",
    "HIGHWAY": "HWY", "HIGHWY": "HWY", "HILL": "HL", "HILLS": "HLS",
    "HOLLOW": "HOLW", "ISLAND": "IS", "JUNCTION": "JCT", "KNOLL": "KNL",
    "LAKE": "LK", "LAKES": "LKS", "LANDING": "LNDG", "LANE": "LN",
    "LOOP": "LOOP", "MANOR": "MNR", "MEADOW": "MDW", "MEADOWS": "MDWS",
    "MILL": "ML", "MOUNT": "MT", "MOUNTAIN": "MTN", "OVERLOOK": "OVLK",
    "PARK": "PARK", "PARKWAY": "PKWY", "PKY": "PKWY", "PASS": "PASS",
    "PATH": "PATH", "PIKE": "PIKE", "PINES": "PNES", "PLACE": "PL",
    "PLAZA": "PLZ", "POINT": "PT", "POINTE": "PT", "RIDGE": "RDG",
    "ROAD": "RD", "RUN": "RUN", "SQUARE": "SQ", "STATION": "STA",
    "STREET": "ST", "STR": "ST", "SUMMIT": "SMT", "TERRACE": "TER",
    "TRACE": "TRCE", "TRAIL": "TRL", "TRL": "TRL", "TURNPIKE": "TPKE",
    "VALLEY": "VLY", "VIEW": "VW", "VILLAGE": "VLG", "VISTA": "VIS",
    "WALK": "WALK", "WAY": "WAY", "WOOD": "WD", "WOODS": "WDS",
    # unit words are DROPPED so "#5", "UNIT 5", "APT 5" all become "5"
    "APARTMENT": "", "APT": "", "SUITE": "", "STE": "", "UNIT": "",
    "NUMBER": "",
}
# Every abbreviated suffix (used to tell "123 WEST ST" from "123 W MAIN ST").
SUFFIX_ABBREVIATIONS = set(v for v in SUFFIX_MAP.values() if v) | {
    "AVE", "BLVD", "CIR", "CT", "CV", "DR", "HWY", "LN", "PKWY", "PL",
    "RD", "ST", "TER", "TRCE", "TRL", "WAY", "XING",
}
# Directionals are dropped — EXCEPT when the word IS the whole street name
# ("123 WEST ST" keeps WEST; "123 W MAIN ST" and "123 MAIN ST NW" drop it).
DIRECTIONALS = {
    "N", "S", "E", "W", "NE", "NW", "SE", "SW",
    "NORTH", "SOUTH", "EAST", "WEST",
    "NORTHEAST", "NORTHWEST", "SOUTHEAST", "SOUTHWEST",
}

# ---------------------------------------------------------------------------
# 6. INPUT FILE DETECTION (inputs/ files are recognized by their COLUMNS)
# ---------------------------------------------------------------------------
# Headers are compared after lowercasing and removing spaces/punctuation,
# so "Sale Date", "sale_date" and "SALEDATE" are all "saledate".
REQUIRED_COLUMNS = {
    "tax_snapshot": ["Parcel", "Owner", "Address", "MailingAddress", "City",
                     "State", "ZIP", "YearsDelinquent", "TaxYears",
                     "OldestYear", "NewestYear", "TotalOwed"],
    "tax_changes": ["Parcel", "Address", "Change", "YearsDelinquent"],
    "foreclosures": ["Address", "City", "ZIP", "Owner", "Type", "Sale Date"],
    "code_violations": ["Address", "City", "ZIP", "CaseNumber", "Status",
                        "DateOpened"],
}
# Reference workbook columns we need.
COUNTY_COLUMNS = ["PIN", "PROPERTYSTREET", "OWNERNAME1", "PCDESC",
                  "PROPCLAS_DESC"]

# Skip-trace files (BatchData / REISkip) are detected flexibly:
SKIP_PHONE_COL_RE = re.compile(r"phone|mobile|cell|landline|wireless", re.I)
SKIP_EMAIL_COL_RE = re.compile(r"e-?mail", re.I)
# Columns that mention "phone" but are NOT phone numbers.
SKIP_NOT_A_VALUE_RE = re.compile(
    r"type|dnc|status|carrier|score|count|connected|litigator|tcpa|"
    r"verified|date|rank|confidence", re.I)
# Property address column: has "address"/"street" but not mailing/email.
SKIP_ADDRESS_COL_RE = re.compile(r"address|street", re.I)
SKIP_ADDRESS_EXCLUDE_RE = re.compile(r"mail|e-?mail|owner", re.I)
SKIP_PARCEL_COL_RE = re.compile(r"^(parcel|pin|apn)", re.I)
# A column only counts as phones if at least this share of its non-blank
# values clean to a 10-digit number.
PHONE_VALUE_SHARE = 0.5
