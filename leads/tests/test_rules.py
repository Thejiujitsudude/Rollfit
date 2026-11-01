"""Unit tests for matching + filtering logic.  Run:  python -m pytest -q"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import rules as R  # noqa: E402
from pipeline import (AddressIndex, clean_phone, is_callable_area,  # noqa: E402
                      is_entity, is_keep_class, match_record,
                      normalize_address, parcel_key, phone_status)


# ---------------------------------------------------------------- addresses
@pytest.mark.parametrize("raw, expected", [
    ("1887 Duluth Highway", "1887 DULUTH HWY"),
    ("1887 DULUTH HWY.", "1887 DULUTH HWY"),
    ("123 N. Main Street", "123 MAIN ST"),
    ("123 Main St NW", "123 MAIN ST"),
    ("45 Oak Ridge Drive", "45 OAK RDG DR"),
    ("9 Pine Lane", "9 PINE LN"),
    ("10 Elm Court", "10 ELM CT"),
    ("88 Lake Circle", "88 LK CIR"),
    ("7 Maple Place", "7 MAPLE PL"),
    ("300 Sugarloaf Parkway", "300 SUGARLOAF PKWY"),
    ("5 Hidden Trace", "5 HIDDEN TRCE"),
    ("6 Quiet Cove", "6 QUIET CV"),
    ("12 Ivy Trail SW", "12 IVY TRL"),
    ("  1860   atkinson   road ", "1860 ATKINSON RD"),
    ("100 Park Pl #5", "100 PARK PL 5"),
    ("100 Park Pl Unit 5", "100 PARK PL 5"),
    ("100 Park Pl Apt. 5", "100 PARK PL 5"),
    ("123 West St", "123 WEST ST"),          # WEST is the street name: kept
    ("123 West Street NE", "123 WEST ST"),
    ("", ""),
    (None, ""),
])
def test_normalize_address(raw, expected):
    assert normalize_address(raw) == expected


def test_normalize_same_house_different_spelling():
    assert normalize_address("1887 Duluth Highway NW") == \
        normalize_address("1887 DULUTH HWY")


# ---------------------------------------------------------------- parcel key
def test_parcel_key_strips_spaces():
    assert parcel_key("R7001 001") == "R7001001"
    assert parcel_key(" r7001  001 ") == "R7001001"
    assert parcel_key("R7001\t001") == parcel_key("R7001001")
    assert parcel_key(None) == ""


def test_parcel_and_pin_join():
    tax_parcel, county_pin = "R5001 123", "R5001123"
    assert parcel_key(tax_parcel) == parcel_key(county_pin)
    assert parcel_key("R5001 124") != parcel_key(county_pin)


# ---------------------------------------------------------------- class filter
@pytest.mark.parametrize("cls", [
    "Residential SFR", "TOWNHOME", "Residential Condominium",
    "Residential Duplex", "Res Percentaged Dwelling", "Mobile Home",
    "  residential   sfr ",
])
def test_keep_classes(cls):
    assert is_keep_class(cls)


@pytest.mark.parametrize("cls", [
    "Residential Vacant", "HOA Vacant Land", "Residual Land",
    "Commercial", "Exempt", "Apartments", "Industrial", "", None,
])
def test_remove_classes(cls):
    assert not is_keep_class(cls)


# ---------------------------------------------------------------- entities
@pytest.mark.parametrize("name", [
    "ABC HOMES LLC", "ABC HOMES L.L.C.", "SMITH FAMILY TRUST",
    "JONES JOHN TRUSTEE", "ACME INC", "ACME CORP", "XYZ PROPERTIES",
    "SUNBELT HOLDINGS", "WELLS FARGO BANK NA", "FIRST BAPTIST CHURCH",
    "MILL CREEK HOMEOWNERS ASSOCIATION", "HOUSING AUTHORITY",
    "STATE OF GEORGIA", "GWINNETT COUNTY", "CITY OF LAWRENCEVILLE",
    "BLUE PARTNERS", "RED INVESTMENTS", "RIVER LP", "OAK LTD",
    "SOUTHERN COMPANY",
])
def test_entity_detected(name):
    assert is_entity(name)


@pytest.mark.parametrize("name", [
    "SMITH JOHN", "GARCIA MARIA & JOSE", "TRUSTY ANNE",   # TRUSTY != TRUST
    "BANKS ROBERT",                                      # BANKS != BANK
    "COUNTYMAN BOB", "INCE PAUL", "", None,
])
def test_person_not_entity(name):
    assert not is_entity(name)


# ---------------------------------------------------------------- phones
@pytest.mark.parametrize("raw, expected", [
    ("(678) 555-1234", "6785551234"),
    ("1-770-555-1234", "7705551234"),
    ("+1 404.555.1234", "4045551234"),
    ("6785551234.0", "6785551234"),
    ("555-1234", None),
    ("", None),
])
def test_clean_phone(raw, expected):
    assert clean_phone(raw) == expected


@pytest.mark.parametrize("code", ["404", "470", "678", "770", "762"])
def test_callable_area_codes(code):
    assert is_callable_area(f"{code}5551234")


@pytest.mark.parametrize("phone", ["2125551234", "7065551234", "9125551234",
                                   "8005551234", "bad"])
def test_out_of_area(phone):
    assert not is_callable_area(phone)


def test_phone_status_priority():
    fresh = {"678", "770"}
    internal, registry = {"6785550001"}, {"6785550001", "6785550002"}
    # internal DNC beats everything, even the registry
    assert phone_status("6785550001", internal, registry, fresh) == R.STATUS_INTERNAL_DNC
    assert phone_status("6785550002", internal, registry, fresh) == R.STATUS_REGISTRY_DNC
    assert phone_status("2125550003", internal, registry, fresh) == R.STATUS_OUT_OF_AREA
    # 404 is a local code but no fresh registry file loaded for it
    assert phone_status("4045550004", internal, registry, fresh) == R.STATUS_NOT_SCRUBBED
    assert phone_status("6785550005", internal, registry, fresh) == R.STATUS_CALLABLE
    assert phone_status("12345", internal, registry, fresh) == R.STATUS_INVALID


# ---------------------------------------------------------------- NO fuzzy
def _index():
    idx = AddressIndex()
    idx.add("R1 001", "1860 ATKINSON RD")
    idx.add("R1 002", "1887 Duluth Hwy")
    idx.add("R1 003", "100 Main St")          # same street address twice in
    idx.add("R9 003", "100 MAIN STREET")      # county = ambiguous
    return idx


def test_no_fuzzy_match_different_house():
    idx = AddressIndex()
    idx.add("R1 001", "1860 ATKINSON RD")
    key, _ = idx.lookup("1887 DULUTH HWY")
    assert key is None


@pytest.mark.parametrize("near_miss", [
    "1861 ATKINSON RD",       # off by one house number
    "1860 ATKINSON",          # missing suffix
    "1860 ATKINSON CT",       # different suffix
    "1860 ATKINSEN RD",       # typo
    "860 ATKINSON RD",
])
def test_near_misses_are_unmatched(near_miss):
    key, reason = _index().lookup(near_miss)
    assert key is None and reason == "no exact address match"


def test_exact_normalized_match():
    key, how = _index().lookup("1887 Duluth Highway NW")
    assert key == "R1002" and how == "address"


def test_ambiguous_address_never_guessed():
    key, reason = _index().lookup("100 Main St")
    assert key is None and "ambiguous" in reason


def test_match_record_parcel_first():
    idx, valid = _index(), {"R1001", "R1002"}
    # parcel wins even if the address text points elsewhere
    assert match_record("R1 001", "1887 DULUTH HWY", valid, idx) == ("R1001", "parcel")
    # no parcel -> exact address
    assert match_record("", "1887 duluth highway", valid, idx) == ("R1002", "address")
    # no parcel + no exact address -> unmatched
    assert match_record("", "1887 DULUTH RD", valid, idx)[0] is None


def test_match_record_not_on_list():
    key, reason = match_record("", "1860 Atkinson Rd", {"R1002"}, _index())
    assert key is None and "not on kept tax list" in reason
