<!DOCTYPE html>
<html>
<head>
    <title>Kiezatlas Mobile (0.5 Beta)</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <!-- what follows shall be an iphone tweak, found via http://stackoverflow.com/questions/4068559 -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta names="apple-mobile-web-app-status-bar-style" content="black-translucent" />

    <meta property="og:type" content="website"/>
    <meta property="og:title" content="Kiezatlas-Mobile, Berlin"/>
    <meta property="og:image" content="http://m.kiezatlas.de/ehrenamt/fb_ehrenamts_screen.jpg"/>
    <meta property="og:url" content="http://m.kiezatlas.de/"/>
    <meta property="og:site_name" content="Kiezatlas-Mobile, Berlin"/>
    <meta property="og:description" content="Diese kostenlose App f&uuml;r Ihr Smartphone liefert Ihnen alle Stadtpl&auml;ne aus dem KiezAtlas auf Ihr mobiles Endger&auml;t."/>

    <?php
        // Main Controler for Adventskalender
        $mapId = null;
        $workspaceId = null;
        if (isset($_GET['mapId']) && isset($_GET['workspaceId'])) {
            // # doors / imagemap entry: selects current day with JS, after loading all images
            $param = $_GET['mapId'];
            $param = split(";", $param); // checking input for a ";"
            $workspace = $_GET['workspaceId'];
            $workspace = split(";", $workspace);
            if (count($param) == 1 && count($workspace) == 1) {
                // parameter without a ";", checking for url-encoded alias of ";"
                $pos = strpos("%3B", $param);
                $sendPos = strpos("%3B", $workspace);
                if ($pos === true || $sendPos === true) {
                    echo ("Input to big, unwanted access.");
                    throw new Exception(404);
                } else {
                    // ok now, we think we have a proper cityMapId
                    $mapId = $param[0];
                    $workspaceId = $workspace[0];
                    // $shortened = substr($param[0], 0, 2);
                    // $dayNr = intval($shortened);
                    // if (strlen($shortened) > 2 || ($dayNr < 0 || $dayNr > 24)) throw new Exception(404);
                    // $someNr = ($dayNr * 3) - 2;
                }
            } else {
                echo ("Input to big, unwanted access.");
                throw new Exception(404);
            }
        }
    ?>

    <link rel="stylesheet" href="leaflet/dist/leaflet.css"/>
    <!--[if lte IE 8]><link rel="stylesheet" href="../dist/leaflet.ie.css" /><![endif]-->
    <link rel="stylesheet" href="css/sitestyle.css"/>
    <script src="jquery.min.js"></script>
    <script src="leaflet/dist/leaflet.js"></script>
    <script src="iscroll.js"></script>
    <!-- script src="ka-0.4.2.min.js"></script-->
    <script src="http://m.kiezatlas.de/ka-SNAPSHOT.js"></script>
</head>
<body>
    <div id="map" class="fullsize">.. loading mobile citymaps</div>
    <script>
        // check if mapId set
        var cityMapId = <?php echo "\"".$mapId."\""; ?>;
        var workspaceId = <?php echo "\"".$workspaceId."\""; ?>;

        kiezatlas.setServiceUrl("http://www.kiezatlas.de/rpc/");
        kiezatlas.setIconsFolder("http://www.kiezatlas.de/client/icons/");
        kiezatlas.setImagesFolder("http://www.kiezatlas.de/client/images/");

        var map = new L.Map('map');

        kiezatlas.setMap(map);
        kiezatlas.renderSite();
        kiezatlas.executeBrowserSpecificCrap();

        // load listing of all "published for mobile" city maps in any case
        if (cityMapId === "" && workspaceId === "") {
          kiezatlas.getPublishedMobileCityMaps("show");
        } else {
          // kiezatlas.selectCityMap({ "target": { "id" : cityMapId }});
          kiezatlas.loadCityMap(cityMapId, workspaceId);
          kiezatlas.getPublishedMobileCityMaps();
        }

        var cloudmadeUrl = 'http://{s}.tiles.mapbox.com/v3/kiezatlas.map-feifsq6f/{z}/{x}/{y}.png',
            cloudmadeAttribution = "Tiles &copy; <a href='http://mapbox.com/'>MapBox</a> | " +
                "Data &copy; <a href='http://www.openstreetmap.org/'>OpenStreetMap</a> and contributors, CC-BY-SA",
        cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: 18, attribution: cloudmadeAttribution});
        // mapbox: "http://a.tiles.mapbox.com/v3/kiezatlas.map-feifsq6f/${z}/${x}/${y}.png",
        //            attribution: "Tiles &copy; <a href='http://mapbox.com/'>MapBox</a> | " +
        //            "Data &copy; <a href='http://www.openstreetmap.org/'>OpenStreetMap</a> " +
        //            "and contributors, CC-BY-SA",
        // osm: "http://b.tile.openstreetmap.de/tiles/osmde/"
        //        attribution: 'Tile server sponsored by STRATO / <b>Europe only</b> / <a href="http://www.openstreetmap.de/germanstyle.html">About style</a>',
        map.addLayer(cloudmade);
        // document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
        // 
    </script>
    <div id="navigation">

        <!-- img src="kiezatlas-logo.png" height="40" title="Zur KiezAtlas Homepage" alt="Zur KiezAtlas Homepage"-->
        <a id="go-more" class="city-map-selection" title="Stadtplanauswahl" alt="Stadtplanauswahl" 
            href="javascript:kiezatlas.showKiezatlasMaps();">Alle Stadtpl&auml;ne</a>
        
        <!-- a id="go-do" class="home" href="http://www.kiezatlas.de">
            KiezAtlas
        </a-->

    </div>
    <div id="info-container">
        <div id="scroller"></div>
        <img id="close-button" width="15px" src="css/dialog-close15.png" onclick="javascript:kiezatlas.closeInfoContainer()">
        <!-- div id="down-button" onclick="javascript:kiezatlas.scrollInfoDown()">Scroll Down</div-->
        <img id="top-button" width="24px" src="css/topscroll.png" onclick="javascript:kiezatlas.myScroll._myResetPos()">
    </div>
    <div id="kiezatlas-control"></div>

</body>
</html>
