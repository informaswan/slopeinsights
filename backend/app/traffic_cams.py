"""Links to official traffic camera pages. Links only: nothing here is scraped or embedded.

Each mountain gets links specific to its access road where we have a verified official page,
followed by its state or province's own camera site. Colorado links open the COtrip map
centered on the place; COtrip has no address that switches its camera layer on, so these
open the map, not a camera view.
"""


def _cotrip(lat: float, lng: float, zoom: int = 11) -> str:
    return f"https://www.cotrip.org/map?lat={lat}&lng={lng}&zoom={zoom}"


def _link(label: str, url: str) -> dict:
    return {"label": label, "url": url}


def _mn511(lng: float, lat: float, zoom: int = 11) -> str:
    layers = "metroTrafficMap,roadReports,normalCameras,weatherWarningsAreaEvents,stationsAlert,trafficSpeeds,otherStateInfo"
    return f"https://511mn.org/@{lng},{lat},{zoom}?show={layers}"


STATE_SITES: dict[str, dict] = {
    "CO": _link("COtrip: Colorado road conditions and cameras", "https://www.cotrip.org/"),
    "UT": _link("UDOT Traffic: cameras", "https://udottraffic.utah.gov/cctv"),
    "CA": _link("Caltrans QuickMap: cameras", "https://quickmap.dot.ca.gov/"),
    "WA": _link("WSDOT: traffic cameras", "https://wsdot.com/traffic/Cameras"),
    "WY": _link("WYDOT: web cameras", "https://www.wyoroad.info/highway/webcameras/webcameras.html"),
    "MT": _link("Montana 511: road report and cameras", "https://www.511mt.net/"),
    "ID": _link("Idaho 511: cameras", "https://511.idaho.gov/cctv"),
    "NM": _link("NMRoads: cameras", "https://nmroads.com/"),
    "VT": _link("New England 511: cameras", "https://newengland511.org/"),
    "NH": _link("New England 511: cameras", "https://newengland511.org/"),
    "ME": _link("New England 511: cameras", "https://newengland511.org/"),
    "NY": _link("511NY: cameras", "https://511ny.org/"),
    "PA": _link("511PA: cameras", "https://www.511pa.com/"),
    "MN": _link("511 Minnesota: cameras", "https://511mn.org/"),
    "WI": _link("511 Wisconsin: cameras", "https://511wi.gov/"),
    "BC": _link("DriveBC: cameras", "https://drivebc.ca/"),
    "ON": _link("Ontario 511: cameras", "https://511on.ca/"),
    "QC": _link("Québec 511: cameras", "https://www.quebec511.info/"),
}

_COTTONWOOD = _link("UDOT Cottonwood Canyons: road cameras", "https://cottonwoodcanyons.udot.utah.gov/")
_PARK_CITY = [
    _link("UDOT Traffic: Park City area cameras", "https://prod-ut.ibi511.com/region/Park%20City"),
    _link("UDOT Wasatch Back: road information", "https://wasatchback.udot.utah.gov/"),
]

# Links specific to a mountain's access road, most useful first.
RESORT_LINKS: dict[str, list[dict]] = {
    # Colorado
    "vail": [
        _link("COtrip map: I-70 at Vail", _cotrip(39.6403, -106.3742)),
        _link("COtrip map: I-70 at Vail Pass", _cotrip(39.5325, -106.2166)),
    ],
    "beaver-creek": [_link("COtrip map: I-70 at Avon", _cotrip(39.6319, -106.5222))],
    "breckenridge": [
        _link("COtrip map: Breckenridge and Frisco", _cotrip(39.5, -106.09, 10)),
        _link("COtrip map: Hoosier Pass (CO-9)", _cotrip(39.3622, -106.0637)),
    ],
    "keystone": [
        _link("COtrip map: Keystone and Silverthorne", _cotrip(39.6, -105.97, 10)),
        _link("COtrip map: Loveland Pass (US-6)", _cotrip(39.6631, -105.8783)),
    ],
    "arapahoe-basin": [
        _link("COtrip map: Loveland Pass (US-6)", _cotrip(39.6631, -105.8783)),
        _link("COtrip map: Eisenhower Tunnel (I-70)", _cotrip(39.6785, -105.9137)),
    ],
    "copper-mountain": [
        _link("COtrip map: I-70 at Copper Mountain", _cotrip(39.5015, -106.151)),
        _link("COtrip map: Fremont Pass (CO-91)", _cotrip(39.3606, -106.1897)),
    ],
    "winter-park": [_link("COtrip map: Berthoud Pass (US-40)", _cotrip(39.7981, -105.7772))],
    "steamboat": [
        _link("COtrip map: Steamboat Springs (US-40)", _cotrip(40.485, -106.8317, 10)),
        _link("COtrip map: Rabbit Ears Pass (US-40)", _cotrip(40.37, -106.61)),
    ],
    "aspen-snowmass": [
        _link("COtrip map: Aspen and Snowmass (CO-82)", _cotrip(39.21, -106.93, 10)),
        _link("COtrip map: I-70 through Glenwood Canyon", _cotrip(39.57, -107.19)),
    ],
    "crested-butte": [
        _link("COtrip map: Crested Butte (CO-135)", _cotrip(38.8697, -106.9878, 10)),
        _link("COtrip map: Gunnison (US-50)", _cotrip(38.5458, -106.9253, 10)),
    ],
    # Utah
    "alta": [_COTTONWOOD],
    "snowbird": [_COTTONWOOD],
    "solitude": [_COTTONWOOD],
    "park-city": _PARK_CITY,
    "deer-valley": _PARK_CITY,
    # Washington
    "stevens-pass": [
        _link("WSDOT: Stevens Pass (US-2)", "https://wsdot.com/travel/real-time/mountainpasses/stevens"),
        _link(
            "WSDOT: US-2 cameras, Gold Bar to Stevens Pass",
            "https://wsdot.com/travel/real-time/cameras/road/002/Gold%20Bar/Stevens%20Pass%20Summit",
        ),
    ],
    "crystal-mountain": [
        _link("WSDOT: Chinook Pass (SR-410)", "https://wsdot.com/travel/real-time/mountainpasses/chinook"),
    ],
    # British Columbia
    "whistler-blackcomb": [
        _link("DriveBC: Highway 99 at Whistler Village Gate", "https://www.drivebc.ca/cameras/522"),
        _link(
            "DriveBC: Sea-to-Sky Highway 99 cameras",
            "https://www.drivebc.ca/mobile/pub/webcams/LowerMainland99SeatoSkyHighway.html",
        ),
    ],
    "revelstoke": [
        _link("DriveBC: Highway 1 at Highway 23, Revelstoke", "https://www.drivebc.ca/cameras/585"),
        _link("DriveBC: Rogers Pass (Highway 1)", "https://www.drivebc.ca/cameras/101"),
    ],
    # Wyoming: WYDOT's camera-by-town search covers Jackson Hole's actual access roads
    # (Teton Pass, Hoback Junction, Wilson) far better than a statewide interstate list.
    "jackson-hole": [
        _link("WYDOT: Jackson-area cameras (Teton Pass, Hoback Jct)",
              "https://www.wyoroad.info/pls/Browse/WRR.CameraCityResults?SelectedTown=Jackson"),
    ],
    # Idaho, Wisconsin and Ontario's 511 sites support filtering the camera list by the
    # exact road/highway; use that instead of the unfiltered statewide list.
    "schweitzer": [
        _link("Idaho 511: US-95 cameras",
              "https://511.idaho.gov/cctv?start=0&length=10&filters%5B0%5D%5Bi%5D=2"
              "&filters%5B0%5D%5Bs%5D=US-95&order%5Bi%5D=1&order%5Bdir%5D=asc"),
    ],
    "wilmot-mountain": [
        _link("511 Wisconsin: I-94 cameras",
              "https://511wi.gov/cctv?start=0&length=10&filters%5B0%5D%5Bi%5D=4"
              "&filters%5B0%5D%5Bs%5D=I-94&order%5Bi%5D=1&order%5Bdir%5D=asc"),
    ],
    "blue-mountain": [
        _link("Ontario 511: Highway 26 cameras (Collingwood)",
              "https://511on.ca/cctv?start=0&length=10&filters%5B0%5D%5Bi%5D=3"
              "&filters%5B0%5D%5Bs%5D=Highway+26&order%5Bi%5D=1&order%5Bdir%5D=asc"),
    ],
    # Minnesota's 511 map accepts a center coordinate and a layer list directly in the URL.
    "afton-alps": [
        _link("511MN: cameras near Afton Alps", _mn511(-92.7917, 44.8622)),
    ],
}


def traffic_cams_for(resort_id: str, state: str) -> list[dict]:
    """Links for one mountain: road-specific pages first, then the state or province's site."""
    links = list(RESORT_LINKS.get(resort_id, []))
    site = STATE_SITES.get(state)
    if site and all(link["url"] != site["url"] for link in links):
        links.append(site)
    return links


COMING_SOON_NOTE = "More precise camera links for this mountain are coming soon."


def traffic_cams_note(resort_id: str) -> str | None:
    """A mountain with no road-specific link yet still gets its state's general camera
    page (see traffic_cams_for) — this says so, rather than silently looking finished."""
    return None if resort_id in RESORT_LINKS else COMING_SOON_NOTE


def _stop(name: str, lat: float, lng: float, zoom: int = 11) -> dict:
    return {"name": name, "lat": lat, "lng": lng, "url": _cotrip(lat, lng, zoom)}


def road_camera_groups() -> list[dict]:
    """Colorado mountain roads. Each stop opens COtrip's map centered on that place."""
    return [
        {
            "name": "I-70: Denver to the mountains",
            "note": "Listed from Denver heading west.",
            "stops": [
                _stop("Denver metro (I-70 at C-470)", 39.7205, -105.1747, 10),
                _stop("Genesee", 39.6864, -105.2955),
                _stop("Floyd Hill", 39.7333, -105.4189),
                _stop("Idaho Springs", 39.7425, -105.5133),
                _stop("Georgetown", 39.7061, -105.697),
                _stop("Eisenhower Tunnel", 39.6785, -105.9137),
                _stop("Silverthorne and Dillon", 39.63, -106.07),
                _stop("Frisco and Copper Mountain", 39.5744, -106.0975),
                _stop("Vail Pass", 39.5325, -106.2166),
                _stop("Vail", 39.6403, -106.3742),
                _stop("Avon and Eagle", 39.64, -106.6),
                _stop("Glenwood Canyon", 39.57, -107.19),
            ],
        },
        {
            "name": "Colorado mountain passes",
            "note": "Roads to the ski areas that are worth checking before you drive.",
            "stops": [
                _stop("Loveland Pass (US-6)", 39.6631, -105.8783),
                _stop("Berthoud Pass (US-40)", 39.7981, -105.7772),
                _stop("Hoosier Pass (CO-9)", 39.3622, -106.0637),
                _stop("Fremont Pass (CO-91)", 39.3606, -106.1897),
                _stop("Rabbit Ears Pass (US-40)", 40.37, -106.61),
                _stop("Independence Pass (CO-82, summer only)", 39.1075, -106.6122),
            ],
        },
    ]
