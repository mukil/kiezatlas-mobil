/** 
 * This is some KiezatlasJS citymap client designed to run on all major mobile screens.
 * @author  Malte Rei&szlig;ig (malte@mikromedia.de), Copyright (c) 2013
 * @license   GPLv3 (http://www.gnu.org/licenses/gpl-3.0.en.html)
 * 
 * @requires  jQuery JavaScript Library v1.9.1, Copyright 2013, John Resig
              Dual licensed under the MIT or GPL Version 2 licenses.(http://jquery.org/license)
 * @requires  leaflet.js, Copyright (c) 2010-2012, CloudMade, Vladimir Agafonkin, All rights reserved.
 *            Used in version/with source code at https://github.com/mukil/Leaflet
 * @requires  jQueryMobile Library v1.3.1, Copyright 2013, John Resig
 *            Dual licensed under the MIT or GPL Version 2 licenses.(http://jquery.org/license)
 *
 * Implementation Notes: 
 * - load*-Methods set data (and even return data if a handler is given)
 * - render* or show*-Methods depend on jquery, jquerymobile and a specific DOM/Layout/IDs
 * - get/set* Methods operate on the kiezatlas-object itself (and use its reference as a client-side model)
 *
 * @modified  19 March 2013
 */

var SERVER_URL = "http://m.kiezatlas.de/";
    // var SERVER_URL = "http://localhost:8080/kiezatlas/";
var ICONS_URL = "http://www.kiezatlas.de/client/icons/"; // to be used by all icons if not relative to this folder
var IMAGES_URL = "http://www.kiezatlas.de/client/images/";

var baseUrl = SERVER_URL;
  baseUrl = "http://localhost/kiezatlas-mobil/";
var permaLink = "";
var linkParams = [];
// debug-state
// var debugUI = false;

var kiezatlas = new function() {
    // 
    this.publishedMaps = new Array();
    this.mapTopics = undefined;
    this.mapTopic = undefined;
    this.workspaceCriterias = undefined;
    this.cityMapId = undefined;
    this.workspaceId = undefined;
    this.defaultMapCenter = undefined;
    this.markersBounds = undefined; // L.LatLngBounds Object
    this.locationCircle = undefined; // L.Circle () if already set once..
    // yet unused: this.selectedCriteria = 0;
    // this.selectedTopic = undefined;
    this.mapLayer = undefined;
    this.map = undefined; // L.Map();
    // 
    this.serverUrl = undefined;
    this.serviceUrl = undefined;
    this.iconsFolder = undefined;
    this.imagesFolder = undefined;
    this.markers = undefined; // arrray of L.Marker Objects
    // 
    this.LEVEL_OF_DETAIL_ZOOM = 15; // the map focus when a mapinternal infoWindow is rendered
    this.LEVEL_OF_STREET_ZOOM = 14; // the map focus when a mapinternal infoWindow is rendered
    this.LEVEL_OF_KIEZ_ZOOM = 13;
    this.LEVEL_OF_DISTRICT_ZOOM = 12;
    this.LEVEL_OF_CITY_ZOOM = 11;
    //
    this.layer = undefined;
    //
    this.historyApiSupported = window.history.pushState;
    this.panoramaOrientation = undefined; // gui helper flag

    this.renderMobileCityMapList = function (obj) {
        // sort given array alphabetical descending
        obj.sort(kiezatlas.alphabetical_sort_desc);
        $("ul.citymap-listing").empty()
        $("ul.citymap-listing").append('<li data-role="list-divider" '
            + ' data-theme="e" id="all-citymaps">Alle Stadtpl&auml;ne</li>')
        for (i = 0; i < obj.length; i++) {
            var element = obj[i]
            var item = $('<li id="'+ element.id +'">') // href="#citymaps-page"
            var link = $('<a id="'+ element.id +'" data="'+ element.workspaceId +'">'+ element.name +'</a>')
            item.bind('vclick', function(e) {
                var elementId = ""+ e.target.parentElement.parentElement.parentElement.id + "";
                var workspaceId = $(e.target).attr("data")
                kiezatlas.cityMapId = elementId
                kiezatlas.workspaceId = workspaceId
                // maybe navigate to: 
                $.mobile.navigate( '#citymaps-page?query=;&mapId=' 
                    +kiezatlas.cityMapId+ '&wsId=' +kiezatlas.workspaceId, 
                    { info: "info about the #foo hash", mapName: element.name, transition: "flow", showLoadMsg: true }
                )
            })
            item.append(link)
            $("ul.citymap-listing").append(item)
        }
        $("#all-citymaps").html("Alle Stadtpl&auml;ne")
        $("ul.citymap-listing").listview( "refresh")
    }

    this.renderMobileCityMapView = function () {
        // set tmp page title
        kiezatlas.setMobileViewTitle("Lade Stadtplanansicht.. ");
        // check if, and if not, initialize leaflet
        if (kiezatlas.map == undefined) {
            // console.log(" map is not initialized.. initializing..")
            kiezatlas.setMap(new L.Map('map'))
        }
        // update model
        kiezatlas.loadCityObjectInfo(kiezatlas.cityMapId)
        kiezatlas.loadCityMapTopics(kiezatlas.cityMapId, kiezatlas.workspaceId);
        kiezatlas.setupLeafletMarkers(true) // all L.LatLng()s are constructed here
        kiezatlas.renderLeafletContainer(true)
        // ask for users location
        kiezatlas.getUsersLocation()
    }

    this.renderLeafletContainer = function (reset) {
        // update gui
        $("#map").height($(window).innerHeight())
        kiezatlas.map.invalidateSize()
        if (reset) {
            kiezatlas.setToCurrentBounds()
            kiezatlas.loadMapTiles()
            // set new page titles to citymap name
            kiezatlas.setMobileViewTitle(kiezatlas.mapTopic.name)
        }
    }

    this.setMobileViewTitle = function(newTitle) {
        $(".my-title").html(newTitle)
        window.document.title = newTitle + " 1.0"
    }

    this.getURLParameter = function(paramName) {
        var searchString = window.location.href.substring(1),
            i, val, params = searchString.split("&");

        for (i=0;i<params.length;i++) {
            val = params[i].split("=");
            if (val[0] == paramName) {
                return decodeURIComponent(val[1]);
            }
        }
        return null;
    }

    this.loadCityMap = function (mapId, workspaceId) {
        kiezatlas.cityMapId = mapId;
        kiezatlas.workspaceId = workspaceId;
        if (kiezatlas.markers != undefined) {
            kiezatlas.clearMarkers();
        }
        jQuery("img.loading").css("display", "block");
        // console.log("showing loading bar => " + jQuery("img.loading").css("display"));
        kiezatlas.loadCityMapTopics(mapId, workspaceId, function () {
            kiezatlas.setupLeafletMarkers();
            kiezatlas.setToCurrentBounds();
            kiezatlas.getUsersLocation();
        });
        // ### FIXMEs mvoe GUI related manipulations into guiSetup/renderFunctions
        kiezatlas.closeInfoContainer(); // close info and  show nav
        /**
        if (cityMapEhrenamtId != undefined && cityMapEventId != undefined) {
            if (kiezatlas.cityMapId == cityMapEhrenamtId) {
                jQuery("#go-do").addClass("selected");
                jQuery("#go-event").removeClass("selected");
            } else if (kiezatlas.cityMapId == cityMapEventId) {
                jQuery("#go-event").addClass("selected");
                jQuery("#go-do").removeClass("selected");
            }
        } **/
        // initiate current citymap state
        // var newLink = baseUrl + "?map=" + mapId;
        // kiezatlas.pushHistory({ "name": "loaded", "parameter": [ mapId, workspaceId ] }, newLink);
        // kiezatlas.hideKiezatlasControl();
    }

    this.loadCityMapTopics = function (mapId, workspaceId, handler) {
        var url = baseUrl + "../proxies/getCityMap.php?mapId="+mapId+"&workspaceId="+workspaceId;
        // var body = '{"method": "getMapTopics", "params": ["' + mapId+ '" , "' + workspaceId + '"]}';
        jQuery.ajax({
            type: "GET", async: false,
                // data: body, 
                url: url, dataType: 'json',
                beforeSend: function(xhr) { 
                xhr.setRequestHeader("Content-Type", "application/json") 
            },
            success: function(obj) {
                kiezatlas.setMapTopics(obj);
                if (handler != undefined) handler();
            },
            error: function(x, s, e) {
                throw new Error("Error while loading city-map. Message: " + JSON.stringify(x));
            }
        });
    }

    this.loadWorkspaceCriterias = function (mapId, handler) {
        var url = baseUrl + "../proxies/getWorkspaceCriterias.php?mapId="+mapId;
        jQuery.ajax({
            type: "GET", async: false,
                url: url, dataType: 'json',
                beforeSend: function(xhr) { 
                xhr.setRequestHeader("Content-Type", "application/json") 
            },
            success: function(obj) {
                kiezatlas.setWorkspaceCriterias(obj)
                kiezatlas.selectedCriteria = 0 // set getCategory to operate on default criteria 1
                if (handler != undefined) handler()
            },
            error: function(x, s, e) {
                throw new Error("Error while loading city-map. Message: " + JSON.stringify(x))
            }
        });
    }

    this.loadMapTiles = function() {
        var cloudmadeUrl = 'http://{s}.tiles.mapbox.com/v3/kiezatlas.map-feifsq6f/{z}/{x}/{y}.png',
            cloudmadeAttribution = "Tiles &copy; <a href='http://mapbox.com/'>MapBox</a> | " +
              "Data &copy; <a href='http://www.openstreetmap.org/'>OpenStreetMap</a> and contributors, CC-BY-SA",
            cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: 18, attribution: cloudmadeAttribution});
        // mapbox: "http://a.tiles.mapbox.com/v3/kiezatlas.map-feifsq6f/${z}/${x}/${y}.png",
        //            attribution: "Tiles &copy; <a href='http://mapbox.com/'>MapBox</a> | " +
        //            "Data &copy; <a href='http://www.openstreetmap.org/'>OpenStreetMap</a> " +
        //            "and contributors, CC-BY-SA",
        // osm: "http://b.tile.openstreetmap.de/tiles/osmde/"
        //        attribution: 'Tile server sponsored by STRATO / <b>Europe only</b> /
        //  <a href="http://www.openstreetmap.de/germanstyle.html">About style</a>',
        // TODO: render nice info message "Map tiles are loding ..."
        /** cloudmade.on('load', function(e) {
          // is just fired when panning the first time out of our viewport, but strangely not on initiali tile-loading
          console.log("tilelayer loaded.. could invaldate #maps size..")
        }); **/
        kiezatlas.map.addLayer(cloudmade);
    }


    /** a get and show method implemented as
     *  an asynchronous call which renders the html directly into the main window when the result has arrived  
     */
    this.loadPublishedMobileCityMaps = function(renderOption) {
        var url = baseUrl + "../proxies/getPublishedMobileMaps.php";
        var body = '{"method": "getMobileCityMaps", "params": [""]}';
        jQuery.ajax({
            type: "POST", url: url, data: body, async: false,
        beforeSend: function(xhr) {xhr.setRequestHeader("Content-Type", "application/json")},
        dataType: 'json',
            success: function(obj) {
                // console.log("found the following mobile city maps")
                // console.log(obj.result.maps)
                kiezatlas.publishedMaps = obj.result.maps;
                kiezatlas.setTitleMapLink(kiezatlas.cityMapId);
                if (renderOption === "show") kiezatlas.showKiezatlasMaps();
            }, // end of success handler
            error: function(x, s, e){
                console.log("Ups, Sorry!", "Bei der Anfrage nach mobilen Stadtpl&auml;nen"
                    + " ist ein Übertragungsfehler aufgetreten. Bitte versuchen Sie es noch einmal.")
            }
        });
    }

    this.setTitleMapLink = function(cityMapId) {
        $(".map-title-link").remove();
        var cityMapName = "";
        if (cityMapId != undefined) {
            for (i=0; i<kiezatlas.publishedMaps.length; i++) {
                var map = kiezatlas.publishedMaps[i];
                if (cityMapId == map['id']) {
                    cityMapName = map['name'];
                }
            }
            $("#navigation").append("<a href=\"http://m.kiezatlas.de/?mapId="+ kiezatlas.cityMapId
                +"&workspaceId="+ kiezatlas.workspaceId +"\" class=\"map-title-link\">"+ cityMapName + "</a>");
        }
    }

    this.onBubbleClick = function (e) {
        var topicId = e.id;
        // load geoobject container
        kiezatlas.info(topicId);
    }

    this.info = function(id) {
        $("#infoo-area").html('<p class="content-body"></p>')
        // fixme: depends on jquerymobile
        $.mobile.changePage( "#infoo", {
            transition: "flow", reverse: false, showLoadMsg: true, changeHash: true
        })
        // fetch the data, and render it
        kiezatlas.loadCityObjectInfo(id, kiezatlas.renderMobileInfoBody)
    }

    this.loadCityObjectInfo = function (topicId, renderFunction) {
        var url = baseUrl + "../proxies/getGeoObjectInfo.php?topicId="+topicId
        // var body = '{"method": "getGeoObjectInfo", "params": ["' + topicId+ '"]}'
        // 
        jQuery.ajax({
            type: "GET", async: false,
                // data: body, 
                url: url, dataType: 'json',
                beforeSend: function(xhr) {
                xhr.setRequestHeader("Content-Type", "application/json")
            },
            success: function(obj) {
                // console.log('loaded \"' + obj.result.name + '\" ' + (renderFunction == undefined))
                kiezatlas.mapTopic = obj.result
                if (renderFunction == undefined) return obj.result // what does this actually do, stupid!
                renderFunction(obj.result);
            },
            error: function(x, s, e) {
                throw new Error('ERROR: detailed information on this point could not be loaded. please try again.' + x)
            }
        })
    }

    this.renderMobileInfoBody = function (topic) {
        var infoHeader = '<div id="info-table">';
            infoHeader += '<h3 class="title">' + topic.name + '</h3></div>';
            // infoHeader += '<a href="#" onclick="javascript:kiezatlas.scrollInfoDown()">||</a>';
        var infoItem = "";
        // 
        var street = kiezatlas.getTopicAddress(topic);
        var postalCode = kiezatlas.getTopicPostalCode(topic);
        var cityName = kiezatlas.getTopicCity(topic);
        var latLng = kiezatlas.getLatLng(topic);
        // 
        if (cityName == undefined) cityName = "Berlin"; // fixing the imported dataset from ehrenamtsnetz
        if (cityName == " Berlin" || cityName == "Berlin") { // ### FIXME sloppy
            var target = street + "%20" + postalCode + "%20" + cityName;
            var publicTransportURL = "http://www.fahrinfo-berlin.de/fahrinfo/bin/query.exe/d?Z=" 
                + target + "&REQ0JourneyStopsZA1=2&start=1";
            var imageLink = '<a href="' + publicTransportURL + '" target="_blank"><img'
                + ' class="fahrinfo" src=\"' + kiezatlas.imagesFolder + 'fahrinfo.gif" border="0" hspace="20"/></a>';
            infoItem = '<div id="info-item"><span class="content">' + street + ', ' + postalCode + ' ' 
                + cityName + imageLink + '</span><br/>';
        } else {
            infoItem = '<div id="info-item">'
                + '<span class="content">' + street + ', ' + postalCode + ' ' + cityName + '</span><br/>';
        }
        // stripping unwanted fields of the data container
        topic = kiezatlas.stripFieldsContaining(topic, "LAT");
        topic = kiezatlas.stripFieldsContaining(topic, "LONG");
        topic = kiezatlas.stripFieldsContaining(topic, "Locked Geometry");
        topic = kiezatlas.stripFieldsContaining(topic, "Forum / Aktivierung");
        topic = kiezatlas.stripFieldsContaining(topic, "Image");
        topic = kiezatlas.stripFieldsContaining(topic, "Icon");
        topic = kiezatlas.stripFieldsContaining(topic, "YADE");
        topic = kiezatlas.stripFieldsContaining(topic, "Name");
        topic = kiezatlas.stripFieldsContaining(topic, "Description");
        topic = kiezatlas.stripFieldsContaining(topic, "Timestamp");
        topic = kiezatlas.stripFieldsContaining(topic, "OriginId");
        topic = kiezatlas.stripFieldsContaining(topic, "Administrator Infos");
        topic = kiezatlas.stripFieldsContaining(topic, "Address");
        // topic = kiezatlas.stripFieldsContaining(topic, "Stichworte");
        topic = kiezatlas.stripFieldsContaining(topic, "Stadt");
        // remove set of categories..
        // topic = kiezatlas.stripFieldsContaining(topic, "Zielgruppen");
        // topic = kiezatlas.stripFieldsContaining(topic, "Einsatzbereiche");
        // topic = kiezatlas.stripFieldsContaining(topic, "Merkmale");
        // topic = kiezatlas.stripFieldsContaining(topic, "Bezirk");
        // topic = kiezatlas.stripFieldsContaining(topic, "Kategorie");
        // 
        var propertyList = ''; //<table width="100%" cellpadding="2" border="0"><tbody>';
        for (var i=0; i < topic.properties.length; i++) {
            // build html for attributes to display for an informational object
            if (topic.properties[i].label.indexOf("Sonstiges") != -1) {
                propertyList += '<p class="additionalInfoWhite">';
            } else if (topic.properties[i].label.indexOf("Administrator") != -1) {
                // skipping: propertyList += '<p class="additionalInfo">';
            } else if (topic.properties[i].label == "Barrierefrei" && topic.properties[i].value == "") {
                // skip rendering Barrierefrei-Field cause value was not set yet
            } else if (topic.properties[i].value === "" || topic.properties[i].value === " ") {
                // skip rendering label for empty value
                // fixme: for empty multi-type properties labels are still rendered
            } else {
                propertyList +=  '<br/>' + topic.properties[i].label + ':&nbsp;';
            }
            // DM Property Type Single Value
            if (topic.properties[i].type == 0) {
                if (topic.properties[i].label.indexOf("Barrierefrei") == -1) {
                    // ordinary rendering for DM Property Type Single Value
                    if (topic.properties[i].value === "" || topic.properties[i].value === " ") {
                        // skip rendering empty value
                    } else {
                        propertyList += '<b>' + topic.properties[i].value + '</b>';
                    }
                } else {
                    // special al rendering for the "BARRIERFREE_ACCESS"-Property
                    if (topic.properties[i].value == "") {
                        // skip rendering Barrierefrei-Field cause value was not set yet
                    } else if (topic.properties[i].value == "Ja") {
                        propertyList += '<b>Ja Rollstuhlgerecht</b></p>';
                    } else if (topic.properties[i].value.indexOf("Eingeschr") != -1) {
                        propertyList += '<b>Eingeschr&auml;nkt Rollstuhlgerecht</b></p>';
                    } else if (topic.properties[i].value == "Nein") {
                        propertyList += '<b>Nicht Rollstuhlgerecht</b></p>';
                    } else {
                        propertyList +=  '<b>' + topic.properties[i].value + '</b></p>';
                    }
                }
                // propertyList +=  '<p>' + topic.properties[i].name + ':&nbsp;<b>'
                    // + topic.properties[i].value + '</b><p/>';
            } else {
                // DM Property Type Multi Value
                var stringValue = "";
                propertyList += '';
                for ( var k=0; k < topic.properties[i].values.length; k++ ) {
                    // 
                    value = topic.properties[i].values[k].name;
                    if (topic.properties[i].name == "Person") {
                        // label = 'Ansprechpartner:&nbsp;';
                        // label + 
                        propertyList += '<b>' + value + '</b>&nbsp;';
                    } else if (topic.properties[i].name == "Webpage") {
                        // label = '';
                        value = kiezatlas.makeWebpageLink(value, value);
                        // label + 
                        propertyList += '<b>' + value + '</b>&nbsp;';
                        // propertyList += '<p><i class="cats">Kategorien:</i>&nbsp;';
                    } else if (!value || /^\s*$/.test(value)) { // http://stackoverflow.com/a/3261380 by Jano Gonzáles
                        // skip rendering space for empty values
                    } else {
                        propertyList += '<br/><b>' + value + '</b>';
                    }
                }
                propertyList += '</br>';
            }
        }
        infoItem += propertyList;
        infoItem += "</p></div>";
        // 
        jQuery("#infoo-area .content-body").html(infoHeader);
        jQuery("#infoo-area .content-body").append(infoItem);
    }

    this.toggleInfoItem = function (e) {
        var itemId = e.currentTarget.offsetParent.children[2].id;
        jQuery('#'+itemId).toggle();
    }

    this.setupLeafletMarkers = function(isMobile) {
        // 
        var KiezAtlasIcon = L.Icon.extend({
          options: {
            iconUrl: 'css/locationPointer.png',
            shadowUrl: null, iconSize: new L.Point(40, 40), shadowSize: null,
            iconAnchor: new L.Point(20, 14), popupAnchor: new L.Point(0, 4)
          }
        });
        var myIcon = new KiezAtlasIcon();
        // 
        if (kiezatlas.markers != undefined) {
            kiezatlas.clearMarkers();
        }
        kiezatlas.markers = new Array(); // helper to keep the refs to all markes once added..
        // 
        for (var i = 0; i < kiezatlas.mapTopics.result.topics.length; i++) {
            // get info locally
            var topic = kiezatlas.mapTopics.result.topics[i];
            var topicId = topic.id;
            var marker = undefined;
            var latlng = undefined;
            var lng = topic.long;
            var lat = topic.lat;
            // sanity check..
            var skip = false;
            if (lat == 0.0 || lng == 0.0) {
                skip = true;
            } else if (lng < -180.0 || lng > 180.0) {
                skip = true;
            } else if (lat < -90.0 || lat > 90.0) {
                skip = true;
            } else if (isNaN(lat) || isNaN(lng)) {
                skip = true;
            }
            if (!skip) {
                latlng = new L.LatLng(parseFloat(lat), parseFloat(lng));
            }
            // 
            if (latlng != undefined) {
                var existingMarker = kiezatlas.getMarkerByLatLng(latlng);
                if (existingMarker != null) {
                    marker = existingMarker;
                    // add our current, proprietary topicId to the marker-object
                    marker.options.topicId.push(topicId);
                    var previousContent = marker._popup._content;
                    marker.bindPopup(kiezatlas.renderTitle(topic) + previousContent);
                } else {
                    marker = new L.Marker(latlng, { 'clickable': true , 'topicId': [topicId] }); // icon: myIcon
                    marker.bindPopup(kiezatlas.renderTitle(topic));
                }
                // add marker to map object
                kiezatlas.map.addLayer(marker);
                // reference each marker in kiezatlas.markers model
                kiezatlas.markers.push(marker);
                // 
                marker.on('click', function (e) {
                    // 
                    this._popup.options.autoPan = true;
                    this._popup.options.maxWidth = 160;
                    this._popup.options.closeButton = true;
                    this.openPopup();
                    // 
                    // bubbles click handler consumed by onBubbleClick
                    // jQuery(".leaflet-popup-content-wrapper").click(kiezatlas.onBubbleClick);
                }, marker);
            }
        }
        // console.log("map.setup => " + kiezatlas.markers.length + " leaflets for "
           // + kiezatlas.mapTopics.result.topics.length + " loaded topics");
        if (isMobile) $.mobile.loader("hide")
    }

    this.renderTitle = function (object) {
        return '<div id="' + object.id + '" onclick="kiezatlas.onBubbleClick(this)" class="topic-name item">'
            + '<b id="' + object.id + '">' + object.name 
            + '&nbsp;&rsaquo;&rsaquo;&rsaquo;</b></div>';
            // <br/>.. mehr Infos dazu
            // <br/><img class="more" src="css/read_more_plus.png"> 
    }

    this.getMarkerByLatLng = function (latLng) {
        //
        for (var i = 0; i < kiezatlas.markers.length; i++) {
            var marker = kiezatlas.markers[i];
            if (marker._latlng.equals(latLng)) {
                return marker;
            }
        }
        // 
        return null;
    }
  
    this.clearMarkers = function  () {
        for (var i = 0; i < kiezatlas.markers.length; i++) {
            var m = kiezatlas.markers[i];
            try {
                kiezatlas.map.removeLayer(m);
            } catch (e) {
                console.log("Exception: " + e);
            }
        }
    }

    this.getMarkersBounds = function () {
        var bounds = new L.LatLngBounds();
        for (var i = 0; i < kiezatlas.markers.length; i++) {
            var m = kiezatlas.markers[i];
            var lng = m._latlng.lng;
            var lat = m._latlng.lat;
            var skip = false;
            if (lat == 0.0 || lng == 0.0) {
                skip = true;
            } else if (lng < -180.0 || lng > 180.0) {
                skip = true;
            } else if (lat < -90.0 || lat > 90.0) {
                skip = true;
            } else if (isNaN(lat) || isNaN(lng)) {
                skip = true;
            }
            if (!skip) {
                var point = new L.LatLng(parseFloat(lat), parseFloat(lng));
                bounds.extend(point);
            }
        }
        return bounds;
    }

    this.getUsersLocation = function (options) {
        // set default options
        if (options == undefined) {
            options =  { "setView" : true, "maxZoom" : kiezatlas.LEVEL_OF_KIEZ_ZOOM };
        }
        // ask browser for location-info
        kiezatlas.map.locate(options);
        // ("img.loading").hide();
    }

    this.onLocationFound = function(e) {
        var radius = e.accuracy;
        if (kiezatlas.locationCircle != undefined) {
          kiezatlas.map.removeLayer(kiezatlas.locationCircle);
        }        
        var $mapMessage = $("#message.notification")
        // $mapMessage.show("fast")
        $mapMessage.html('Ihr Smartphone hat Sie gerade automatisch lokalisiert.<br/>'
            + 'Dr&uuml;cken Sie hier um den Kartenausschnit zur&uuml;ckzusetzen.')
        $mapMessage.click(kiezatlas.setToCurrentBounds)
        $mapMessage.fadeIn(1000)
        setTimeout(function(e) {
            $mapMessage.fadeOut(3000)
        }, 3000)
        kiezatlas.locationCircle = new L.Circle(e.latlng, radius, { "stroke": true, "clickable": false, "color":
            "#1d1d1d", "fillOpacity": 0.3, "opacity": 0.3, "weight":10}); // show double sized circle..
        kiezatlas.map.addLayer(kiezatlas.locationCircle, { "clickable" : true });
        kiezatlas.locationCircle.bindPopup("You are within " + radius + " meters from this point");
        kiezatlas.map.setView(e.latlng, kiezatlas.LEVEL_OF_KIEZ_ZOOM);
        // kiezatlas.map.panTo(e.latlng);
    }
  
    this.onLocationError = function (e) {
        // TODO:
    }

    this.closeNotificationDialog = function () {
        jQuery("#message").remove();
    }

    /** sorting desc by item.value */
    this.alphabetical_sort_desc = function (a, b) {
        // console.log(a)
        var scoreA = a.name
        var scoreB = b.name
        if (scoreA < scoreB) // sort string descending
          return -1
        if (scoreA > scoreB)
          return 1
        return 0 //default return value (no sorting)
    }

  this.setMap = function(mapObject)  {
    this.map = mapObject;
    //
    this.map.options.touchZoom = true;
    kiezatlas.map.on('locationfound', kiezatlas.onLocationFound);
    // kiezatlas.map.on('locationerror', kiezatlas.onLocationError);
  }

  this.setMapTopics = function(topics) {
    this.mapTopics = topics;
  }

  this.setMapTopics = function(topics) {
    this.mapTopics = topics;
  }

  this.setCityMapId = function (topicId) {
    this.cityMapId = topicId;
  }

  this.setSelectedTopic = function(topic) {
    this.selectedTopic = topic;
  }

  this.setLayer = function(markerLayer) {
    this.layer= markerLayer;
  }

  this.setMapLayer = function(mapLayer) {
    this.mapLayer= mapLayer;
  }

  this.setSelectedCriteria= function(id) {
    this.selectedCriteria = id;
  }

  this.setWorkspaceCriterias = function(crits) {
    this.workspaceCriterias = crits;
  }

  this.getWorkspaceCriterias = function() {
    return this.workspaceCriterias;
  }
  
  this.setServerUrl = function(url) {
    this.serverUrl = url;
  }

  this.setServiceUrl = function(url) {
    this.serviceUrl = url;
  }
  
  this.setIconsFolder = function(path) {
    this.iconsFolder = path;
  }
  
  this.setImagesFolder = function(path) {
    this.imagesFolder = path;
  }
  
  this.setToCurrentBounds = function () {
    kiezatlas.markersBounds = kiezatlas.getMarkersBounds();
    kiezatlas.map.fitBounds(kiezatlas.markersBounds);
  }

  this.popHistory = function (state) {
    // simulate the back and forth navigation...
    if (!this.historyApiSupported) {
      return;
    } else {
      // TODO:
      // console.log(state);
    }
  }

  this.pushHistory = function (state, link) {
    // 
    if (!this.historyApiSupported) {
      return;
    }
    // build history entry
    var history_entry = {state: state, url: link};
    // console.log(history_entry);
    // push history entry
    window.history.pushState(history_entry.state, null, history_entry.url);
  }

  this.windowHeight = function () {
    if (self.innerHeight) {
      return self.innerHeight;
    }
    if (document.documentElement && document.documentElement.clientHeight) {
      return jQuery.clientHeight;
    }
    if (document.body) {
      return document.body.clientHeight;
    }
    return 0;
  }
  
  this.windowWidth = function () {
    if (self.innerWidth) {
      return self.innerWidth;
    }
    if (document.documentElement && document.documentElement.clientWidth) {
      return jQuery.clientWidth;
    }
    if (document.body) {
      return document.body.clientWidth;
    }
    return 0;
  }
  
  // Info-Container utility method
  this.stripFieldsContaining = function (topic, fieldName) {
    var newProps = new Array();
    for (var it=0; it < topic.properties.length; it++) {
      if (topic.properties[it].name.indexOf(fieldName) == -1) {
        newProps.push(topic.properties[it]);
      } else if (topic.properties[it].name.indexOf("Email") != -1) {
        // save Email Address Property being stripped by a command called "Address""
        newProps.push(topic.properties[it]);
      } else {
        //
      }
    }
    topic.properties = newProps;
    return topic;
  }
  
  this.getTopicAddress = function (topic) {
    for (var i=0; i < topic.properties.length; i++) {
      if (topic.properties[i].name == "Address / Street" && topic.properties[i].value != "") {
      // via related Address Topic
      return topic.properties[i].value;
      } else if (topic.properties[i].name == "Straße" && topic.properties[i].value != "") {
      // via related Street PropertyField
      return topic.properties[i].value;
      }
    }
    return "";
  }
  
  this.getImageSource = function (topic) {
    for (var i=0; i < topic.properties.length; i++) {
      if (topic.properties[i].name == "Image / File" && topic.properties[i].value != "") {
        return topic.properties[i].value;
      }
    }
    return "undefined";
  }

  this.getTopicPostalCode = function (topic) {
    for (var i=0; i < topic.properties.length; i++) {
      if (topic.properties[i].name == "Address / Postal Code") {
        return topic.properties[i].value; // + ' Berlin<br/>';
      }
    }
    return "";
  }

  this.getTopicOriginId = function (topic) {
    for (var i=0; i < topic.properties.length; i++) {
      if (topic.properties[i].name == "OriginId") {
        return topic.properties[i].value; // + ' Berlin<br/>';
      }
    }
    return "";
  }

  this.getTopicCity = function (topic) {
    for (var at=0; at < topic.properties.length; at++) {
      // resultHandler.append('<tr><td>'+topic.properties[i].label+'</td><td>'+topic.properties[i].value+'</td></tr>');
      if (topic.properties[at].name == "Address / City") {
        return topic.properties[at].value; // + ' Berlin<br/>';
      } else if (topic.properties[at].name == "Stadt") {
        return topic.properties[at].value;
      }
    }
    return null;
  }
  
  this.getLatLng = function (topic) {
    var lat = undefined;
    var lng = undefined;
    // 
    for (var it=0; it < topic.properties.length; it++) {
      // resultHandler.append('<tr><td>'+topic.properties[i].label+'</td><td>'+topic.properties[i].value+'</td></tr>');
      if (topic.properties[it].name == "LAT") {
        lat = topic.properties[it].value; // + ' Berlin<br/>';
      } else if (topic.properties[it].name == "LONG") {
        lng = topic.properties[it].value;
      }
    }
    return new L.LatLng(lat, lng);
  }

  this.makeEhrenamtsLink = function (url, label) {
    // quick fix to correct automaticyll imported links to new external mobile-website
    var indexForMobileURL = url.indexOf("g.cfm");
    var firstPartURL = url.substr(0, indexForMobileURL + 1);
    var secondPartURL = url.substr(indexForMobileURL + 1);
    var newMobileURL = firstPartURL + "_mobil" + secondPartURL;
    urlMarkup = '<a href="' + newMobileURL + '" target="_blank">Link zur T&auml;tigkeitsbeschreibung</a>';
      //  + '<img src="css/link_extern.gif" alt="(externer Link)" border="0" height="11" width="12"/>
    // else urlMarkup = '<a href="'+url+'" target="_blank">'+label+'</a>';
    return urlMarkup
  }
  
  this.makeWebpageLink = function (url, label) {
    urlMarkup = '<a href="' + url + '" target="_blank">' + label + '</a>';
      //  + '<img src="css/link_extern.gif" alt="(externer Link)" border="0" height="11" width="12"/>
    // else urlMarkup = '<a href="'+url+'" target="_blank">'+label+'</a>';
    return urlMarkup
  }

  this.makeEmailLink = function (url, label) {
    urlMarkup = '<a href="mailto:' + url + '" target="_blank">' + label + '</a>';
    return urlMarkup
  }

  this.getCategory = function(categoryId) {
    var category = {};
    for (var i = 0; i < this.workspaceCriterias.result[this.selectedCriteria].categories.length; i++) {
      // looping over all cats of a crit
      var id = this.workspaceCriterias.result['' + this.selectedCriteria + ''].categories[i].catId;
      if (id == categoryId) {
        category.icon = this.workspaceCriterias.result['' + this.selectedCriteria + ''].categories[i].catIcon;
        category.name = this.workspaceCriterias.result['' + this.selectedCriteria + ''].categories[i].catName;
        return category;
      }
    }
    return null;
  }

}

