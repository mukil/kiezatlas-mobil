/** 
 * This is some KiezatlasJS citymap client designed to run on all major mobile screens.
 * @author  Malte Rei&szlig;ig (rma@mikromedia.de), Copyright (c) 2012
 * @license   GPLv3 (http://www.gnu.org/licenses/gpl-3.0.en.html)
 * 
 * @requires  jQuery JavaScript Library v1.5.2, Copyright 2011, John Resig
              Dual licensed under the MIT or GPL Version 2 licenses.(http://jquery.org/license)
 * @requires  leaflet.js, Copyright (c) 2010-2012, CloudMade, Vladimir Agafonkin, All rights reserved.
 *            Used in version/with source code at https://github.com/mukil/Leaflet
 * @requires  iscroll.js v4.1.9 ~ Copyright (c) 2011 Matteo Spinelli, http://cubiq.org
 *            Released under MIT license, (http://cubiq.org/license)
* 
 * @modified  02.July 2012
 */var SERVER_URL="http://m.kiezatlas.de/",ICONS_URL="http://www.kiezatlas.de/client/icons/",IMAGES_URL="http://www.kiezatlas.de/client/images/",baseUrl=SERVER_URL,permaLink="",linkParams=[],kiezatlas=new function(){this.publishedMaps=new Array,this.mapTopics=undefined,this.mapTopic=undefined,this.workspaceCriterias=undefined,this.cityMapId=undefined,this.workspaceId=undefined,this.defaultMapCenter=undefined,this.markersBounds=undefined,this.locationCircle=undefined,this.mapLayer=undefined,this.map=undefined,this.serverUrl=undefined,this.serviceUrl=undefined,this.iconsFolder=undefined,this.imagesFolder=undefined,this.markers=undefined,this.LEVEL_OF_DETAIL_ZOOM=15,this.LEVEL_OF_STREET_ZOOM=14,this.LEVEL_OF_KIEZ_ZOOM=13,this.LEVEL_OF_DISTRICT_ZOOM=12,this.LEVEL_OF_CITY_ZOOM=11,this.layer=undefined,this.historyApiSupported=window.history.pushState,this.panoramaOrientation=undefined,this.myScroll=undefined,this.renderSite=function(){var a='<a class="leaflet-control-zoom-loc" href="#" title="Zu Ihrem jetzigen Standort"></a>';NaN,kiezatlas.map.on("locationfound",kiezatlas.onLocationFound),kiezatlas.map.on("locationerror",kiezatlas.onLocationError),jQuery(a).insertBefore(".leaflet-control-zoom-in"),jQuery(".leaflet-control-zoom-loc").click(kiezatlas.getUsersLocation),jQuery("a#go-more").click(kiezatlas.showKiezatlasMaps),jQuery(window).resize(kiezatlas.handleOrientationChange),kiezatlas.hideAddressBarThroughScrolling()},this.executeBrowserSpecificCrap=function(){var a=document.getElementsByTagName("head")[0],b=document.createElement("style");navigator.userAgent.indexOf("Fennec")!=-1?b.innerHTML="@media only screen { #top-button { display: none !important; } #go-more { background-position: 30px 10px; } }":navigator.userAgent.indexOf("WebKit")!=-1&&navigator.userAgent.indexOf("Android")!=-1?b.innerHTML="@media only screen { #go-more { background-position: 30px 12px !important;} }":navigator.userAgent.indexOf("Opera")!=-1&&(b.innerHTML="@media only screen { #go-more { background-position: 30px 12px !important;} }"),a.appendChild(b)},this.renderMobileCityMapList=function(a){a.sort(kiezatlas.alphabetical_sort_desc),$("ul.citymap-listing").empty(),$("ul.citymap-listing").append('<li data-role="list-divider"  data-theme="e" id="all-citymaps">Alle Stadtpl&auml;ne</li>');for(i=0;i<a.length;i++){var b=a[i],c=$('<li id="'+b.id+'">'),d=$('<a id="'+b.id+'" data="'+b.workspaceId+'">'+b.name+"</a>");c.bind("vclick",function(a){var c=""+a.target.parentElement.parentElement.parentElement.id+"",d=$(a.target).attr("data");kiezatlas.cityMapId=c,kiezatlas.workspaceId=d,$.mobile.navigate("#citymaps-page?query=;&mapId="+kiezatlas.cityMapId+"&wsId="+kiezatlas.workspaceId,{info:"info about the #foo hash",mapName:b.name,transition:"flow",showLoadMsg:!0})}),c.append(d),$("ul.citymap-listing").append(c)}$("#all-citymaps").html("Alle Stadtpl&auml;ne"),$("ul.citymap-listing").listview("refresh")},this.renderMobileCityMapView=function(){kiezatlas.setMobileViewTitle("Lade Stadtplanansicht.. "),kiezatlas.map==undefined&&kiezatlas.setMap(new L.Map("map")),kiezatlas.loadCityObjectInfo(kiezatlas.cityMapId),kiezatlas.loadCityMapTopics(kiezatlas.cityMapId,kiezatlas.workspaceId),kiezatlas.setupLeafletMarkers(!0),kiezatlas.updateMobileMapGUI(!0),kiezatlas.getUsersLocation()},this.updateMobileMapGUI=function(a){$("#map").height($(window).innerHeight()),kiezatlas.map.invalidateSize(),a&&(kiezatlas.setToCurrentBounds(),kiezatlas.loadMapTiles(),kiezatlas.setMobileViewTitle(kiezatlas.mapTopic.name))},this.setMobileViewTitle=function(a){$(".my-title").html(a),window.document.title=a+" 1.0"},this.getURLParameter=function(a){var b=window.location.href.substring(1),c,d,e=b.split("&");for(c=0;c<e.length;c++){d=e[c].split("=");if(d[0]==a)return decodeURIComponent(d[1])}return null},this.loadCityMap=function(a,b){kiezatlas.cityMapId=a,kiezatlas.workspaceId=b,kiezatlas.markers!=undefined&&kiezatlas.clearMarkers(),jQuery("img.loading").css("display","block"),kiezatlas.loadCityMapTopics(a,b,function(){kiezatlas.setupLeafletMarkers(),kiezatlas.setToCurrentBounds(),kiezatlas.getUsersLocation()}),kiezatlas.closeInfoContainer()},this.loadCityMapTopics=function(a,b,c){var d=baseUrl+"../proxies/getCityMap.php?mapId="+a+"&workspaceId="+b,e='{"method": "getMapTopics", "params": ["'+a+'" , "'+b+'"]}';jQuery.ajax({type:"GET",async:!1,url:d,dataType:"json",beforeSend:function(a){a.setRequestHeader("Content-Type","application/json")},success:function(a){kiezatlas.setMapTopics(a),c!=undefined&&c()},error:function(a,b,c){throw new Error("Error while loading city-map. Message: "+JSON.stringify(a))}})},this.loadMapTiles=function(){var a="http://{s}.tiles.mapbox.com/v3/kiezatlas.map-feifsq6f/{z}/{x}/{y}.png",b="Tiles &copy; <a href='http://mapbox.com/'>MapBox</a> | Data &copy; <a href='http://www.openstreetmap.org/'>OpenStreetMap</a> and contributors, CC-BY-SA",c=new L.TileLayer(a,{maxZoom:18,attribution:b});kiezatlas.map.addLayer(c)},this.getPublishedMobileCityMaps=function(a){var b=baseUrl+"../proxies/getPublishedMobileMaps.php",c='{"method": "getMobileCityMaps", "params": [""]}';jQuery.ajax({type:"POST",url:b,data:c,async:!1,beforeSend:function(a){a.setRequestHeader("Content-Type","application/json")},dataType:"json",success:function(b){kiezatlas.publishedMaps=b.result.maps,kiezatlas.setTitleMapLink(kiezatlas.cityMapId),a==="show"&&kiezatlas.showKiezatlasMaps()},error:function(a,b,c){console.log("Ups, Sorry!","Bei der Anfrage nach mobilen Stadtpl&auml;nen ist ein Übertragungsfehler aufgetreten. Bitte versuchen Sie es noch einmal.")}})},this.setTitleMapLink=function(a){$(".map-title-link").remove();var b="";if(a!=undefined){for(i=0;i<kiezatlas.publishedMaps.length;i++){var c=kiezatlas.publishedMaps[i];a==c["id"]&&(b=c.name)}$("#navigation").append('<a href="http://m.kiezatlas.de/?mapId='+kiezatlas.cityMapId+"&workspaceId="+kiezatlas.workspaceId+'" class="map-title-link">'+b+"</a>")}},this.showKiezatlasMaps=function(){var a=jQuery("#kiezatlas-control"),b='<ul class="ka-select">';a.html(b);var c=$(".ka-select");for(i=0;i<kiezatlas.publishedMaps.length;i++){var d=kiezatlas.publishedMaps[i];c.append('<li class="map-button" id="'+d.id+'">'+d.name+"</li>")}$(".map-button").click(kiezatlas.selectCityMap),a.toggle("fast")},this.selectCityMap=function(a){var b=a.target.id;for(i=0;i<kiezatlas.publishedMaps.length;i++){var c=kiezatlas.publishedMaps[i];if(b==c["id"]){if(c["workspaceId"]==undefined)throw new Error("Der Stadtplan konnte nicht geladen werden, es ist ein Fehler in der Konfiguration der Stadtpl&auml;ne aufgetreten. Bitte versuchen Sie es erneut in dem Sie die aktuelle Seite der Anwendung neu laden. Falls diese Fehlermeldung erneut auftritt bitte setzen Sie uns davon in Kenntniss, schicken Sie Bitte den aktuellen Link (aus der Adressleiste) des Fehlers an mobile@kiezatlas.de damit wir das Problem beheben k&ouml;nnen. \r\nVielen herzlichen Dank f&uuml;r Ihre Unterst&uuml;tzung, Ihr KiezAtlas Team.");kiezatlas.loadCityMap(b,c.workspaceId),kiezatlas.setTitleMapLink(b);var d=baseUrl+"?mapId="+b+"&workspaceId="+c.workspaceId;kiezatlas.pushHistory({name:"map-select",parameter:b},d),kiezatlas.hideKiezatlasControl();break}}},this.info=function(a){$("#infoo-area").html('<p class="content-body"></p>'),$.mobile.changePage("#infoo",{transition:"flow",reverse:!1,showLoadMsg:!0,changeHash:!0}),kiezatlas.loadCityObjectInfo(a,kiezatlas.renderMobileInfoBody)},this.loadCityObjectInfo=function(a,b){var c=baseUrl+"../proxies/getGeoObjectInfo.php?topicId="+a;jQuery.ajax({type:"GET",async:!1,url:c,dataType:"json",beforeSend:function(a){a.setRequestHeader("Content-Type","application/json")},success:function(a){kiezatlas.mapTopic=a.result;if(b==undefined)return a.result;b(a.result)},error:function(a,b,c){throw new Error("ERROR: detailed information on this point could not be loaded. please try again."+a)}})},this.renderMobileInfoBody=function(a){var b='<div id="info-table">';b+='<h3 class="title">'+a.name+"</h3></div>";var c="",d=kiezatlas.getTopicAddress(a),e=kiezatlas.getTopicPostalCode(a),f=kiezatlas.getTopicCity(a),g=kiezatlas.getLatLng(a);f==undefined&&(f="Berlin");if(f==" Berlin"||f=="Berlin"){var h=d+"%20"+e+"%20"+f,i="http://www.fahrinfo-berlin.de/fahrinfo/bin/query.exe/d?Z="+h+"&REQ0JourneyStopsZA1=2&start=1",j='<a href="'+i+'" target="_blank"><img'+' class="fahrinfo" src="'+kiezatlas.imagesFolder+'fahrinfo.gif" border="0" hspace="20"/></a>';c='<div id="info-item"><span class="content">'+d+", "+e+" "+f+j+"</span><br/>"}else c='<div id="info-item"><span class="content">'+d+", "+e+" "+f+"</span><br/>";a=kiezatlas.stripFieldsContaining(a,"LAT"),a=kiezatlas.stripFieldsContaining(a,"LONG"),a=kiezatlas.stripFieldsContaining(a,"Locked Geometry"),a=kiezatlas.stripFieldsContaining(a,"Forum / Aktivierung"),a=kiezatlas.stripFieldsContaining(a,"Image"),a=kiezatlas.stripFieldsContaining(a,"Icon"),a=kiezatlas.stripFieldsContaining(a,"YADE"),a=kiezatlas.stripFieldsContaining(a,"Name"),a=kiezatlas.stripFieldsContaining(a,"Description"),a=kiezatlas.stripFieldsContaining(a,"Timestamp"),a=kiezatlas.stripFieldsContaining(a,"OriginId"),a=kiezatlas.stripFieldsContaining(a,"Administrator Infos"),a=kiezatlas.stripFieldsContaining(a,"Address"),a=kiezatlas.stripFieldsContaining(a,"Stadt");var k="";for(var l=0;l<a.properties.length;l++){a.properties[l].label.indexOf("Sonstiges")!=-1?k+='<p class="additionalInfoWhite">':a.properties[l].label.indexOf("Administrator")==-1&&(a.properties[l].label!="Barrierefrei"||a.properties[l].value!="")&&a.properties[l].value!==""&&a.properties[l].value!==" "&&(k+="<br/>"+a.properties[l].label+":&nbsp;");if(a.properties[l].type==0)a.properties[l].label.indexOf("Barrierefrei")==-1?a.properties[l].value!==""&&a.properties[l].value!==" "&&(k+="<b>"+a.properties[l].value+"</b>"):a.properties[l].value!=""&&(a.properties[l].value=="Ja"?k+="<b>Ja Rollstuhlgerecht</b></p>":a.properties[l].value.indexOf("Eingeschr")!=-1?k+="<b>Eingeschr&auml;nkt Rollstuhlgerecht</b></p>":a.properties[l].value=="Nein"?k+="<b>Nicht Rollstuhlgerecht</b></p>":k+="<b>"+a.properties[l].value+"</b></p>");else{var m="";k+="";for(var n=0;n<a.properties[l].values.length;n++)value=a.properties[l].values[n].name,a.properties[l].name=="Person"?k+="<b>"+value+"</b>&nbsp;":a.properties[l].name=="Webpage"?(value=kiezatlas.makeWebpageLink(value,value),k+="<b>"+value+"</b>&nbsp;"):!!value&&!/^\s*$/.test(value)&&(k+="<br/><b>"+value+"</b>");k+="</br>"}}c+=k,c+="</p></div>",jQuery("#infoo-area .content-body").html(b),jQuery("#infoo-area .content-body").append(c)},this.toggleInfoItem=function(a){var b=a.currentTarget.offsetParent.children[2].id;jQuery("#"+b).toggle()},this.setupLeafletMarkers=function(a){var b=L.Icon.extend({options:{iconUrl:"css/locationPointer.png",shadowUrl:null,iconSize:new L.Point(40,40),shadowSize:null,iconAnchor:new L.Point(20,14),popupAnchor:new L.Point(0,4)}}),c=new b;kiezatlas.markers!=undefined&&kiezatlas.clearMarkers(),kiezatlas.markers=new Array;for(var d=0;d<kiezatlas.mapTopics.result.topics.length;d++){var e=kiezatlas.mapTopics.result.topics[d],f=e.id,g=undefined,h=undefined,i=e.long,j=e.lat,k=!1;if(j==0||i==0)k=!0;else if(i<-180||i>180)k=!0;else if(j<-90||j>90)k=!0;else if(isNaN(j)||isNaN(i))k=!0;k||(h=new L.LatLng(parseFloat(j),parseFloat(i)));if(h!=undefined){var l=kiezatlas.getMarkerByLatLng(h);if(l!=null){g=l,g.options.topicId.push(f);var m=g._popup._content;g.bindPopup(kiezatlas.renderTitle(e)+m)}else g=new L.Marker(h,{clickable:!0,topicId:[f]}),g.bindPopup(kiezatlas.renderTitle(e));kiezatlas.map.addLayer(g),kiezatlas.markers.push(g),g.on("click",function(a){this._popup.options.autoPan=!0,this._popup.options.maxWidth=160,this._popup.options.closeButton=!0,this.openPopup()},g)}}a&&$.mobile.loader("hide")},this.renderTitle=function(a){return'<div id="'+a.id+'" onclick="kiezatlas.onBubbleClick(this)" class="topic-name item">'+'<b id="'+a.id+'">'+a.name+"&nbsp;&rsaquo;&rsaquo;&rsaquo;</b></div>"},this.onBubbleClick=function(a){var b=a.id;kiezatlas.info(b)},this.getMarkerByLatLng=function(a){for(var b=0;b<kiezatlas.markers.length;b++){var c=kiezatlas.markers[b];if(c._latlng.equals(a))return c}return null},this.clearMarkers=function(){for(var a=0;a<kiezatlas.markers.length;a++){var b=kiezatlas.markers[a];try{kiezatlas.map.removeLayer(b)}catch(c){console.log("Exception: "+c)}}},this.getMarkersBounds=function(){var a=new L.LatLngBounds;for(var b=0;b<kiezatlas.markers.length;b++){var c=kiezatlas.markers[b],d=c._latlng.lng,e=c._latlng.lat,f=!1;if(e==0||d==0)f=!0;else if(d<-180||d>180)f=!0;else if(e<-90||e>90)f=!0;else if(isNaN(e)||isNaN(d))f=!0;if(!f){var g=new L.LatLng(parseFloat(e),parseFloat(d));a.extend(g)}}return a},this.getUsersLocation=function(a){a==undefined&&(a={setView:!0,maxZoom:kiezatlas.LEVEL_OF_KIEZ_ZOOM}),kiezatlas.map.locate(a)},this.onLocationFound=function(a){var b=a.accuracy;kiezatlas.locationCircle!=undefined&&kiezatlas.map.removeLayer(kiezatlas.locationCircle);var c=$("#message.notification");c.html("Ihr Smartphone hat Sie gerade automatisch lokalisiert.<br/>Dr&uuml;cken Sie hier um den Kartenausschnit zur&uuml;ckzusetzen."),c.click(kiezatlas.setToCurrentBounds),c.fadeIn(1e3),setTimeout(function(a){c.fadeOut(3e3)},3e3),kiezatlas.locationCircle=new L.Circle(a.latlng,b,{stroke:!0,clickable:!1,color:"#1d1d1d",fillOpacity:.3,opacity:.3,weight:10}),kiezatlas.map.addLayer(kiezatlas.locationCircle,{clickable:!0}),kiezatlas.locationCircle.bindPopup("You are within "+b+" meters from this point"),kiezatlas.map.setView(a.latlng,kiezatlas.LEVEL_OF_KIEZ_ZOOM)},this.onLocationError=function(a){kiezatlas.closeNotificationDialog();var b='<div id="message" onclick="kiezatlas.closeNotificationDialog()" class="notification"><div id="content">Die Abfrage ihres aktuellen Standorts wurde erfolgreich zur&uuml;ckgewiesen. Mit dem folgenden Link bieten wir ihnen die M&ouml;glichkeit <a href="javascript:kiezatlas.showKiezatlasMaps()">einen der 12 Berliner Stadtbezirke direkt anzuw&auml;hlen.</a></div></div>';jQuery("#map").append(b)},this.closeNotificationDialog=function(){jQuery("#message").remove()},this.alphabetical_sort_desc=function(a,b){var c=a.name,d=b.name;return c<d?-1:c>d?1:0},this.setMap=function(a){this.map=a,this.map.options.touchZoom=!0,kiezatlas.map.on("locationfound",kiezatlas.onLocationFound)},this.setMapTopics=function(a){this.mapTopics=a},this.setCityMapId=function(a){this.cityMapId=a},this.setSelectedTopic=function(a){this.selectedTopic=a},this.setLayer=function(a){this.layer=a},this.setMapLayer=function(a){this.mapLayer=a},this.setSelectedCriteria=function(a){this.selectedCriteria=a},this.setWorkspaceCriterias=function(a){this.workspaceCriterias=a},this.setServerUrl=function(a){this.serverUrl=a},this.setServiceUrl=function(a){this.serviceUrl=a},this.setIconsFolder=function(a){this.iconsFolder=a},this.setImagesFolder=function(a){this.imagesFolder=a},this.setToCurrentBounds=function(){kiezatlas.markersBounds=kiezatlas.getMarkersBounds(),kiezatlas.map.fitBounds(kiezatlas.markersBounds)},this.popHistory=function(a){if(!this.historyApiSupported)return;a.name=="loaded"?kiezatlas.loadCityMap(a.parameter[0],a.parameter[1]):a.name=="info"&&kiezatlas.info(a.parameter)},this.pushHistory=function(a,b){if(!this.historyApiSupported)return;var c={state:a,url:b};window.history.pushState(c.state,null,c.url)},this.handleOrientationChange=function(a){var b=kiezatlas.windowHeight(),c=kiezatlas.windowWidth();b>c?(jQuery("#info-container").removeClass("info-container-panorama"),jQuery("#info-container").removeClass("info-container-panorama-big"),jQuery("#info-container").addClass("info-container-portrait"),jQuery("#map").removeClass("panorama-width-big"),jQuery("#map").removeClass("panorama-width"),jQuery("#map").addClass("portrait-height"),kiezatlas.panoramaOrientation=!1):b<c&&(jQuery("#info-container").removeClass("info-container-portrait"),c>810?(jQuery("#info-container").addClass("info-container-panorama-big"),jQuery("#map").addClass("panorama-width-big")):(jQuery("#info-container").addClass("info-container-panorama"),jQuery("#map").addClass("panorama-width")),jQuery("#map").removeClass("portrait-height"),kiezatlas.panoramaOrientation=!0)},this.windowHeight=function(){return self.innerHeight?self.innerHeight:document.documentElement&&document.documentElement.clientHeight?jQuery.clientHeight:document.body?document.body.clientHeight:0},this.windowWidth=function(){return self.innerWidth?self.innerWidth:document.documentElement&&document.documentElement.clientWidth?jQuery.clientWidth:document.body?document.body.clientWidth:0},this.stripFieldsContaining=function(a,b){var c=new Array;for(var d=0;d<a.properties.length;d++)a.properties[d].name.indexOf(b)==-1?c.push(a.properties[d]):a.properties[d].name.indexOf("Email")!=-1&&c.push(a.properties[d]);return a.properties=c,a},this.getTopicAddress=function(a){for(var b=0;b<a.properties.length;b++){if(a.properties[b].name=="Address / Street"&&a.properties[b].value!="")return a.properties[b].value;if(a.properties[b].name=="Straße"&&a.properties[b].value!="")return a.properties[b].value}return""},this.getImageSource=function(a){for(var b=0;b<a.properties.length;b++)if(a.properties[b].name=="Image / File"&&a.properties[b].value!="")return a.properties[b].value;return"undefined"},this.getTopicPostalCode=function(a){for(var b=0;b<a.properties.length;b++)if(a.properties[b].name=="Address / Postal Code")return a.properties[b].value;return""},this.getTopicOriginId=function(a){for(var b=0;b<a.properties.length;b++)if(a.properties[b].name=="OriginId")return a.properties[b].value;return""},this.getTopicCity=function(a){for(var b=0;b<a.properties.length;b++){if(a.properties[b].name=="Address / City")return a.properties[b].value;if(a.properties[b].name=="Stadt")return a.properties[b].value}return null},this.getLatLng=function(a){var b=undefined,c=undefined;for(var d=0;d<a.properties.length;d++)a.properties[d].name=="LAT"?b=a.properties[d].value:a.properties[d].name=="LONG"&&(c=a.properties[d].value);return new L.LatLng(b,c)},this.makeEhrenamtsLink=function(a,b){var c=a.indexOf("g.cfm"),d=a.substr(0,c+1),e=a.substr(c+1),f=d+"_mobil"+e;return urlMarkup='<a href="'+f+'" target="_blank">Link zur T&auml;tigkeitsbeschreibung</a>',urlMarkup},this.makeWebpageLink=function(a,b){return urlMarkup='<a href="'+a+'" target="_blank">'+b+"</a>",urlMarkup},this.makeEmailLink=function(a,b){return urlMarkup='<a href="mailto:'+a+'" target="_blank">'+b+"</a>",urlMarkup},this.getCategory=function(a){var b={};for(var c=0;c<this.workspaceCriterias.result[this.selectedCriteria].categories.length;c++){var d=this.workspaceCriterias.result[""+this.selectedCriteria+""].categories[c].catId;if(d==a)return b.icon=this.workspaceCriterias.result[""+this.selectedCriteria+""].categories[c].catIcon,b.name=this.workspaceCriterias.result[""+this.selectedCriteria+""].categories[c].catName,b}return null}};