# tests/test_seed.py
from app.seed import seed_resorts, RESORTS
from app.models.resort import Resort


def test_seed_resort_count(db):
    seed_resorts(db)
    count = db.query(Resort).count()
    assert count == 45


def test_seed_idempotent(db):
    seed_resorts(db)
    seed_resorts(db)  # second call should not duplicate
    count = db.query(Resort).count()
    assert count == 45


def test_seed_epic_count(db):
    seed_resorts(db)
    count = db.query(Resort).filter_by(pass_type="epic").count()
    assert count == 20


def test_seed_ikon_count(db):
    seed_resorts(db)
    count = db.query(Resort).filter_by(pass_type="ikon").count()
    assert count == 25


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
