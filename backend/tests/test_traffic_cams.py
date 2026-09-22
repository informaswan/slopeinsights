# tests/test_traffic_cams.py
"""Traffic camera links: static links to official agency pages, nothing scraped."""
from urllib.parse import parse_qs, urlparse

from app.seed import RESORTS, seed_resorts
from app.traffic_cams import STATE_SITES, road_camera_groups, traffic_cams_for


def _links(resort):
    return traffic_cams_for(resort["id"], resort["state"])


def test_every_mountain_has_at_least_one_camera_link():
    missing = [r["id"] for r in RESORTS if not _links(r)]
    assert missing == []


def test_every_state_or_province_we_cover_has_an_official_site():
    assert {r["state"] for r in RESORTS} <= set(STATE_SITES)


def test_links_are_well_formed_and_unique_per_mountain():
    for r in RESORTS:
        links = _links(r)
        urls = [link["url"] for link in links]
        assert len(urls) == len(set(urls)), r["id"]
        for link in links:
            assert link["label"].strip(), r["id"]
            assert link["url"].startswith("https://"), (r["id"], link["url"])
            assert " " not in link["url"], (r["id"], link["url"])
            assert "localhost" not in link["url"]


def test_specific_links_come_before_the_general_state_site():
    vail = traffic_cams_for("vail", "CO")
    assert "cotrip.org/map" in vail[0]["url"]
    assert vail[-1]["url"] == STATE_SITES["CO"]["url"]


def test_a_specific_link_is_not_repeated_as_the_state_fallback():
    # Big Sky has no specific link yet, so it must show only the state's own camera page once.
    assert len(traffic_cams_for("big-sky", "MT")) == 1


def test_jackson_hole_has_its_specific_link_plus_the_state_fallback():
    urls = [link["url"] for link in traffic_cams_for("jackson-hole", "WY")]
    assert len(urls) == 2
    assert "SelectedTown=Jackson" in urls[0]
    assert urls[1] == STATE_SITES["WY"]["url"]


def test_every_colorado_mountain_links_to_a_map_near_its_road():
    for r in RESORTS:
        if r["state"] == "CO":
            assert any("cotrip.org/map" in link["url"] for link in _links(r)), r["id"]


def test_places_with_their_own_camera_pages_link_to_them():
    def urls(resort_id, state):
        return [link["url"] for link in traffic_cams_for(resort_id, state)]

    assert any("wsdot.com" in u and "stevens" in u.lower() for u in urls("stevens-pass", "WA"))
    assert any("cottonwoodcanyons.udot.utah.gov" in u for u in urls("alta", "UT"))
    assert any("cottonwoodcanyons.udot.utah.gov" in u for u in urls("snowbird", "UT"))
    assert any("drivebc.ca/cameras/" in u for u in urls("whistler-blackcomb", "BC"))
    # Each of these targets the mountain's actual access road, not just a statewide page:
    assert any("SelectedTown=Jackson" in u for u in urls("jackson-hole", "WY"))
    assert any("US-95" in u for u in urls("schweitzer", "ID"))
    assert any("Highway+26" in u for u in urls("blue-mountain", "ON"))
    assert any("I-94" in u for u in urls("wilmot-mountain", "WI"))
    assert any("normalCameras" in u and "-92.7917" in u for u in urls("afton-alps", "MN"))


def test_i70_corridor_runs_from_denver_west_to_glenwood_canyon():
    corridor = road_camera_groups()[0]
    assert corridor["name"] == "I-70: Denver to the mountains"
    names = [s["name"] for s in corridor["stops"]]
    assert names[0].startswith("Denver")
    assert names[-1] == "Glenwood Canyon"
    for expected in ("Idaho Springs", "Eisenhower Tunnel", "Vail Pass", "Vail"):
        assert any(expected in n for n in names), expected
    longitudes = [s["lng"] for s in corridor["stops"]]
    assert longitudes == sorted(longitudes, reverse=True)  # strictly heading west


def test_every_corridor_link_centers_the_official_map_on_its_stop():
    for group in road_camera_groups():
        for stop in group["stops"]:
            url = urlparse(stop["url"])
            assert (url.scheme, url.netloc, url.path) == ("https", "www.cotrip.org", "/map")
            q = parse_qs(url.query)
            assert float(q["lat"][0]) == stop["lat"]
            assert float(q["lng"][0]) == stop["lng"]
            assert 8 <= float(q["zoom"][0]) <= 13


def test_mountain_passes_are_listed_too():
    passes = road_camera_groups()[1]
    names = " ".join(s["name"] for s in passes["stops"])
    for expected in ("Loveland Pass", "Berthoud Pass", "Hoosier Pass", "Fremont Pass"):
        assert expected in names


def test_resort_detail_includes_camera_links(client, db):
    seed_resorts(db)
    detail = client.get("/api/resorts/vail", headers={"X-API-Key": "dev-key"}).json()
    assert detail["traffic_cams"]
    assert set(detail["traffic_cams"][0]) == {"label", "url"}


def test_road_cameras_endpoint_serves_the_corridor_groups(client):
    data = client.get("/api/road-cameras", headers={"X-API-Key": "dev-key"}).json()
    assert data["groups"][0]["name"] == "I-70: Denver to the mountains"
    assert data["groups"][0]["stops"][0]["name"].startswith("Denver")
    assert all({"name", "url"} <= set(s) for g in data["groups"] for s in g["stops"])


def test_each_group_explains_itself():
    assert all(g["note"] for g in road_camera_groups())
