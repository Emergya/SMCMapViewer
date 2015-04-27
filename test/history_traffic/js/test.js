function initMap() {

    // Centered in Quito
    var map = SMC.map('map');
    map.setView([-0.2006705, -78.5322076], 10);


    var base = SMC.tileLayer({
        // url: 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
        maxZoom: 18,
    }).addTo(map);


    // Add satelite layer
    var satelite = L.tileLayer.wms("http://maps.opengeo.org/geowebcache/service/wms", {
        layers: "bluemarble",
        format: 'image/png',
        transparent: true,
        attribution: "Weather data © 2012 IEM Nexrad"
    });
    // Add layers to control group
    var baseLayer = {
        "Street Map": base,
        "Satelite": satelite
    };
    // Add control to map
    var leyenda = SMC.layerTreeControl(baseLayer, {
        collapsed: false
    }).addTo(map);

    var stylesheet =
        '*[density=12]{color: "red";} *[density=11]{color: "#FACC2E";} *[density=10]{color: "#088A08";} ';

    // Add tree to map
    var tree = [{
        type: 'folder',
        label: 'Folder',
        layers: [{

            type: 'folder',
            label: 'Folder 1',
            layers: [{
                type: "SMC.layers.geometry.SolrGeometryHistoryLayer",
                params: [{
                    serverURL: "http://localhost:8983/solr/traffic/select",
                    timeField: 'time',
                    label: 'Solr Traffic',
                    stylesheet: stylesheet,
                    draggingUpdates: false,
                    time: 1000
                }]

            }]

        }, {
            type: "SMC.layers.history.AggregatingHistoryLayer",
            label: 'History Geometry',
            layers: [{
                type: 'SMC.layers.geometry.WFSGeometryLayer',
                params: [{
                    serverURL: 'http://www.salford.gov.uk/geoserver/OpenData/wfs',
                    typeName: 'OpenData:Parks',
                    label: 'Parks 1',
                    date: '1',
                    zoomOffset: 0,
                    draggingUpdates: true,
                    stylesheet: '* {fillColor: "rgba(0, 0, 255, 0.5)";}',

                }]

            }, {
                type: 'SMC.layers.geometry.WFSGeometryLayer',
                params: [{
                    serverURL: 'http://www.salford.gov.uk/geoserver/OpenData/wfs',
                    typeName: 'OpenData:Parks',
                    label: 'Parks 2',
                    date: '2',
                    zoomOffset: 0,
                    draggingUpdates: true,
                    stylesheet: '* {fillColor: "rgba(255, 0, 0, 0.5)";}',

                }]
            }, {
                type: 'SMC.layers.geometry.WFSGeometryLayer',
                params: [{
                    serverURL: 'http://www.salford.gov.uk/geoserver/OpenData/wfs',
                    typeName: 'OpenData:Parks',
                    label: 'Parks 3',
                    date: '3',
                    zoomOffset: 0,
                    draggingUpdates: true,
                    stylesheet: '* {fillColor: "rgba(0, 255, 0, 0.5)";}',

                }]
            }]
        }, {
            id: "trafficHistoryLayer",
            type: "SMC.layers.geometry.SolrGeometryHistoryLayer",
            params: [{
                //serverURL: "http://172.28.99.70:8983/solr/traffic/select",
                serverURL: "http://195.77.82.75:8888/solr/traffic/select",
                timeField: 'time',
                label: "Historico Trafico",
                time: 1000,
                stylesheet: '*[density=12.0]{color: "red";} *[density=11.0]{color: "#FACC2E";} *[density=10.0]{color: "#088A08";} '
            }]
        }]

    }];

    map.loadLayers(tree);

}

L.Icon.Default.imagePath = "../../dist/images";

window.onload = initMap;