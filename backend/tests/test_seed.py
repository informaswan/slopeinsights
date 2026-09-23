# tests/test_seed.py
from app.seed import seed_resorts, seed_parking_lots, RESORTS, PARKING_LOTS
from app.models.resort import Resort
from app.models.parking import ParkingLot


def test_seed_resort_count(db):
    seed_resorts(db)
    count = db.query(Resort).count()
    assert count == 50


def test_seed_idempotent(db):
    seed_resorts(db)
    seed_resorts(db)  # second call should not duplicate
    count = db.query(Resort).count()
    assert count == 50


def test_seed_epic_count(db):
    seed_resorts(db)
    count = db.query(Resort).filter_by(pass_type="epic").count()
    assert count == 21


def test_seed_ikon_count(db):
    seed_resorts(db)
    count = db.query(Resort).filter_by(pass_type="ikon").count()
    assert count == 26


def test_seed_independent_count(db):
    seed_resorts(db)
    ids = {r.id for r in db.query(Resort).filter_by(pass_type="independent").all()}
    assert ids == {"mt-hood-meadows", "timberline-lodge", "monarch"}


def test_whistler_present(db):
    seed_resorts(db)
    resort = db.query(Resort).filter_by(id="whistler-blackcomb").first()
    assert resort is not None
    assert resort.country == "CA"
    assert resort.timezone == "America/Vancouver"


def test_all_resorts_have_liftie_id(db):
    seed_resorts(db)
    resorts = db.query(Resort).all()
    for r in resorts:
        assert r.liftie_id, f"{r.name} missing liftie_id"


def test_all_resorts_have_coordinates(db):
    seed_resorts(db)
    resorts = db.query(Resort).all()
    for r in resorts:
        assert r.latitude is not None, f"{r.name} missing latitude"
        assert r.longitude is not None, f"{r.name} missing longitude"


def test_seed_parking_lot_count(db):
    seed_parking_lots(db)
    assert db.query(ParkingLot).count() == len(PARKING_LOTS)


def test_seed_parking_lots_idempotent(db):
    seed_parking_lots(db)
    seed_parking_lots(db)  # second call should not duplicate
    assert db.query(ParkingLot).count() == len(PARKING_LOTS)


def test_seeded_parking_lots_are_static_not_live(db):
    seed_parking_lots(db)
    lots = db.query(ParkingLot).all()
    for lot in lots:
        assert lot.is_live is False, f"{lot.lot_name} should be seeded as static"


def test_vail_has_named_parking_lots(db):
    seed_parking_lots(db)
    names = {
        lot.lot_name for lot in db.query(ParkingLot).filter_by(resort_id="vail").all()
    }
    assert "Vail Village Parking Structure" in names
    assert "Lionshead Parking Structure" in names
