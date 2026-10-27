# tests/test_seed.py
from app.seed import seed_resorts, seed_webcams, seed_parking_lots, RESORTS, PARKING_LOTS
from app.models.resort import Resort
from app.models.parking import ParkingLot
from app.models.webcam import Webcam


def test_seed_resort_count(db):
    seed_resorts(db)
    count = db.query(Resort).count()
    assert count == 52


def test_seed_idempotent(db):
    seed_resorts(db)
    seed_resorts(db)  # second call should not duplicate
    count = db.query(Resort).count()
    assert count == 52


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
    assert ids == {"mt-hood-meadows", "timberline-lodge", "monarch", "buck-hill", "hyland-hills"}


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


def test_seed_webcams_renames_a_cam_that_is_already_in_the_table(db):
    seed_resorts(db)
    db.add(Webcam(resort_id="solitude", label="Summit Express Bottom", cam_type="jpeg",
                  url="https://webcams.opensnow.com/current/3787.jpg", is_alive=False))
    db.commit()
    seed_webcams(db)
    cam = db.query(Webcam).filter_by(url="https://webcams.opensnow.com/current/3787.jpg").one()
    assert cam.label == "Apex Express Bottom"
    assert cam.is_alive is False  # the health checker owns this flag; reseeding must not revive a dead cam


def test_seed_webcams_does_not_duplicate_on_reseed(db):
    seed_resorts(db)
    seed_webcams(db)
    n = db.query(Webcam).count()
    seed_webcams(db)
    assert db.query(Webcam).count() == n


def test_only_resorts_without_an_opensnow_feed_have_no_cameras():
    # Loon, Wilmot, Blue Mountain, Buck Hill and Hyland Hills have no cameras of their own on OpenSnow.
    from app.seed import RESORTS, WEBCAMS
    with_cams = {w["resort_id"] for w in WEBCAMS}
    assert {r["id"] for r in RESORTS} - with_cams == {"loon-mountain", "wilmot-mountain", "blue-mountain", "buck-hill", "hyland-hills"}


def test_minnesota_additions_are_complete(db):
    seed_resorts(db)
    for rid in ("buck-hill", "hyland-hills"):
        r = db.query(Resort).filter_by(id=rid).first()
        assert r.state == "MN" and r.timezone == "America/Chicago"
        assert r.summit_elevation_ft and r.vertical_drop_ft and r.onthesnow_slug
