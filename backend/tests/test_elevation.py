from app.elevation import adjust_temp_f, meters_to_feet


def test_climbing_cools_about_3_5_degrees_per_1000_ft():
    assert adjust_temp_f(30, 8000, 11000) == 20  # 30 - 3.5 * 3 = 19.5, rounds to 20


def test_descending_warms():
    assert adjust_temp_f(10, 11000, 9000) == 17


def test_same_elevation_is_unchanged():
    assert adjust_temp_f(25, 9000, 9000) == 25


def test_missing_inputs_give_none():
    assert adjust_temp_f(None, 8000, 11000) is None
    assert adjust_temp_f(30, None, 11000) is None
    assert adjust_temp_f(30, 8000, None) is None


def test_meters_to_feet():
    assert round(meters_to_feet(2500)) == 8202
