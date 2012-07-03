# Description

This simple JavaScript/HTML client _loads_ and _displays_ all _GeoObjects_ of any given kiezatlas city map as interactive _markers_ on an OpenStreetMap (base layer). Clicking on an interactive marker loads a bubble displaiyng the name of the point of interest, which then becomes an interactive bubble itself, allowing users to load more information for the POI into a smartphone display (area covering 40% of the displays width/panorama, resp. height/portrait) with minimally 640px height and 320px width. The viewport of the city map can be controlled by the user of a touch-device and addtional information to any given point on the map can be accessed live through the web service of kiezatlas.de.

Main goal of this new city map client is to easify accessiblity of all information available on http://www.kiezatlas.de when a geo-location is given. The technological aim of this development is to provide _one_ interactive kiezatlas website which is useable on most mobile devices currently available.

# Technology

JavaScript/HTML: jQuery, lates leaflet.js, iscroll.js
PHP: Proxying Scripts based on HTTP/Request.php 

# Functionality

* load all POIs of any given kiezatlas city map via 'kiezatlas.loadCityMapTopics(cityMapId, workspaceId)'
* load all details of any given POI via 'kiezatlas.loadCityObjectInfo(topicId)'

As well as possibly set the map viewport to the users current location 'kiezatlas.getUsersLocation()'

# Version history

**0.3-SNAPSHOT** - RC1 for _EhrenamtsnetzApp_
- Scrolling in the detailed information panel works
- Added a static dialog to focus 1 out of 12 berlin districts
- Sources fixed for loading and switching between 2 specific city maps

**0.2-SNAPSHOT** - Core functionality working for the first time
- Any given kiezatlas city is loaded (via a php proxy script) and displayed on a OSM (with leaflet)
- Markers are interactive, loading and rendering of all details (DeepaMehta.TopicBean) work
- Basic styling, portrait and panorama layout available

Last modified, July 3, 2012
Malte Rei&szlig;ig
