# app/webcam_streams.py
"""YouTube live streams for cams we already show as pictures.

OpenSnow lists some cams as "Live": each is a YouTube live stream (see the `stream.embed_url`
in the page data of opensnow.com/location/<slug>/cams). Keyed by OpenSnow cam id, the number in
webcams.opensnow.com/current/<id>.jpg. Only streams YouTube's oEmbed reports as public are kept.
The app plays these straight from YouTube, so no video passes through our server.
"""
import re

LIVE_STREAMS: dict[str, str] = {  # a bare YouTube video id, or a full https:// embed URL
    # Palisades Tahoe's own embeds (ozolio.com), titled on the embed pages themselves.
    "4624": "SH63YaIWyK0",  # breckenridge: Town Main Street
    "4627": "mHTTPNYltZo",  # breckenridge: Mountain View
    "1833": "https://relay.ozolio.com/pub.api?cmd=embed&oid=EMB_EIFC0000015B",  # palisades-tahoe: High Camp
    "4201": "https://relay.ozolio.com/pub.api?cmd=embed&oid=EMB_ZIGI00000147",  # palisades-tahoe: Palisades Base (embed titled "Palisades Base Area")
    "3929": "https://relay.ozolio.com/pub.api?cmd=embed&oid=EMB_EMST000001C4",  # palisades-tahoe: Top of Far East
    "4200": "https://relay.ozolio.com/pub.api?cmd=embed&oid=EMB_FPOI000010AB",  # palisades-tahoe: Alpine Chalet
    "4623": "8Et9fVZld7E",  # telluride: Downtown Telluride
    "2444": "usL8La5W0Fw",  # big-sky: Andesite Snow Stake
    "2340": "dMr-Jt_K3Cc",  # big-sky: Everett's 8800
    "3603": "TsG0Utw13bs",  # big-sky: Headwaters Snow Stake
    "4203": "6iW7bdSavUo",  # big-sky: Lone Peak Tram
    "3238": "r8qiPv9XCOM",  # deer-valley: Empire Canyon Lodge
    "4490": "0shWeR7Fvpg",  # deer-valley: Galena Express
    "4615": "RaX_MhXETq4",  # deer-valley: Hoodoo Express
    "3055": "XZjubaPbamE",  # deer-valley: Revelator Express
    "101": "uE_ent5rC3Y",  # deer-valley: Silver Lake
    "102": "QozKoFs-hL0",  # deer-valley: Snow Park
    "2689": "4vi7EiWba7E",  # deer-valley: Snow Stake
    "3890": "iNdfTLilLlU",  # deer-valley: Top of Ruby
    "2349": "sAjdqw-lzgI",  # deer-valley: Sultan Express
    "1148": "9--ZgYEZBhk",  # mammoth: Canyon Lincoln
    "3695": "BH-9QONvk1A",  # mammoth: Eagle Lodge Base
    "4532": "m4u2kGpkYD4",  # mammoth: Main Lodge 2
    "1147": "jFK8bVYad0M",  # mammoth: McCoy Station (Chair 23)
    "2047": "awxz_oIlJE0",  # mammoth: Summit - Top Station
    "4618": "lyN2JG7zowo",  # mt-bachelor: Mid-Mountain View
    "1828": "ORlXPRywWd4",  # mt-bachelor: Snow Stake
    "4620": "gAftCYziGW4",  # mt-bachelor: Top of Cloudchaser
    "4619": "pXHMtXbmo7k",  # mt-bachelor: Top of Sunrise
    "2356": "7INfYvwClC0",  # schweitzer: Basin Express Summit
    "901": "6-8KuVdZJWA",  # schweitzer: Colburn Triple Summit
    "3383": "7vfVVc9AhcQ",  # schweitzer: Lakeview Triple Summit
    "3876": "B6k3gfxXxLc",  # schweitzer: Outback
    "3875": "Y3LI7eFJ6wo",  # schweitzer: Rowdy Grouse looking North
    "2355": "aanmce5KMZI",  # schweitzer: Village
    "4209": "Yx3QmuKfwjY",  # solitude: Link Lift Line
    "1854": "NSiItCGabfo",  # solitude: Moonbeam Express Base
    "3365": "ta-4QZbfMXc",  # solitude: Moonbeam Parking
    "2114": "yeoBog_kSzc",  # solitude: Powderhorn Bottom
    "3364": "lkEM6EC8NVA",  # solitude: Snow Stake
    "2115": "Lnznapxh2xM",  # solitude: Sunshine Bowl
    "3914": "nfTQNv3jdSQ",  # steamboat: Christie Peak & Wild Blue Gondola
    "3588": "Zf21nwFUyUs",  # steamboat: Four Points
    "3403": "oKKj_upaoCI",  # steamboat: Gondola Square Base
    "2609": "2UJDLWcSADk",  # steamboat: Gondola Square Base Area South
    "2780": "lKc9xwndUK4",  # steamboat: Snow Stake Mid-Mountain
    "3402": "Vz_BJ5NJOM0",  # steamboat: Snow Stake Summit
    "1985": "nuCNVEHvrHQ",  # steamboat: Thunderhead
    "3953": "SqWPtm63rJc",  # stratton: Golf Course
    "3952": "H-_sGi4Sbtk",  # stratton: Main Lodge
    "2171": "AhcH03HwuH0",  # stratton: Mid-Mountain
    "3951": "ildHe_RG1Mk",  # stratton: Snow Bowl
    "2172": "9E00W9R_Cnc",  # stratton: Summit
    "4535": "ju7zEm_gql0",  # stratton: Sun Bowl Base
    "947": "jhCh3dsEv-M",  # sugarbush: Base Area
    "3069": "dR2pY9L3md8",  # sugarbush: Gadd Peak
    "949": "F5m1Ac9ZvKc",  # sugarbush: Heaven's Gate Cam
    "2371": "gWPiruOopeE",  # sugarbush: Snow Stake Summit
    "3981": "be_gqTEj7CU",  # sugarloaf: Bullwinkle's
    "4632": "7oFquXv78Ck",  # sugarloaf: Golf Course
    "3982": "e66yj2vN96A",  # sugarloaf: Narrow Gauge
    "4230": "6fhCC_0q_as",  # sugarloaf: Snow Stake
    "3933": "j8VVBhJdyqY",  # sugarloaf: The Beach
    "4175": "Hstis9bupws",  # sunday-river: Golf Course
    "3980": "J98tW5YX4Z8",  # sunday-river: Peak Lodge
    "2507": "vyWAzJAWv4w",  # winter-park: Base Area
    "2872": "HfX4H3MSwXs",  # winter-park: Lunch Rock
    "2871": "Dt_WhmxV0yE",  # winter-park: Snoasis
    "2506": "yj-5Q1vBMaA",  # winter-park: Snow Stake
    "2508": "jGS0j-viJmM",  # winter-park: Tubing Hill
}

_CAM_ID = re.compile(r"webcams\.opensnow\.com/current/(\d+)\.jpg")


def stream_url_for(cam_url: str) -> str | None:
    """Embed URL for a cam's live stream, or None if it has no stream."""
    m = _CAM_ID.search(cam_url)
    video = LIVE_STREAMS.get(m.group(1)) if m else None
    if not video:
        return None
    if video.startswith("https://"):
        return video
    return f"https://www.youtube-nocookie.com/embed/{video}?autoplay=1&mute=1&playsinline=1&rel=0"
