require("./markers.js");
require("../SingleLayer.js");
require("../stylers/MarkerCssStyler.js");

require("../../../lib/leaflet.markercluster/dist/leaflet.markercluster-src.js");
require("../../../lib/LeafletHtmlIcon.js");


/**
 * Base layer for all SMC map viewer's layers rendered using markers.
 * @class
 * @abstract
 * @mixes SMC.layers.SingleLayer
 * @mixes SMC.layers.stylers.MarkerCssStyler
 */
SMC.layers.markers.MarkerLayer = L.FeatureGroup.extend(
    /** @lends SMC.layers.markers.MarkerLayer# */
    {

        _markersMap: {},

        /**
         * Initialize the class with options parameter
         * @param {object} options - default options
         */
        initialize: function(options) {
            this.clusterGroup = new L.MarkerClusterGroup({
                polygonOptions: {
                    fill: false,
                    stroke: false
                }
            });

            this.noClusterGroup = new L.FeatureGroup();
            SMC.layers.stylers.MarkerCssStyler.prototype.initialize.apply(this, arguments);
            SMC.layers.SingleLayer.prototype.initialize.apply(this, arguments);
        },

        /**
         * Method to remove a layer from the map
         * @param {SMC.Layers.Layer} layer - default options
         */
        removeLayer: function(layer) {
            if (this.clusterGroup.hasLayer(layer)) {
                this.clusterGroup.removeLayer(layer);
            } else if (this.noClusterGroup.hasLayer(layer)) {
                this.noClusterGroup.removeLayer(layer);
            } else {
                this.getMap().removeLayer(layer);
            }

        },

        /**
         * Method to load the control in the map
         * @param {SMC.Map} map - Map to be added
         */
        onAdd: function(map) {
            this.onRemove(map);
            SMC.layers.SingleLayer.prototype.onAdd.call(this, map);
            L.FeatureGroup.prototype.onAdd.call(this, map);
            if (this._slidermove) {
                this.noClusterGroup._slidermove = true;
                this.clusterGroup._slidermove = true;
            }
            map.addLayer(this.noClusterGroup);
            map.addLayer(this.clusterGroup);

            if (map) {
                map.on("zoomend", this._onViewChanged, this);
            }
        },
        
        /**
         * Method to remove the control in the map
         * @param {SMC.Map} map - Map to be removed
         */
        onRemove: function(map) {
            var self = this;

            var clusterGroup = this.clusterGroup.getLayers();
            $.each(clusterGroup, function(index, marker) {
                marker.parent = self;
            });
            this.clusterGroup.clearLayers();
            map.removeLayer(this.clusterGroup);


            var noClusterGroup = this.noClusterGroup.getLayers();
            $.each(noClusterGroup, function(index, marker) {
                marker.parent = self;
            });
            this.noClusterGroup.clearLayers();
            map.removeLayer(this.noClusterGroup);

            L.FeatureGroup.prototype.onRemove.call(this, map);

            if (map) {
                map.off("zoomend", this._onViewChanged, this);
            }

        },

        /**
         * Method to add layer on the map
         * @param {SMC.layers.Layer} layer - layer to be added
         */
        addLayer: function(layer) {

            if (layer instanceof L.Marker) {
                var marker = layer;
                this._applyStyles(marker);

                marker.on("click", function() {
                    this.onFeatureClicked(marker);
                }, this);

                return marker;

            } else
                throw new Error("This is not a marker");

        },

        _sendFeatures: function(features) {
            var self = this;
            $.each(features, function(index, feature) {
                self._addMarker(feature);
            });
        },

        /**
         * Method to load markers from features on the map
         * @param {object} features - features to be added
         */
        addMarkerFromFeature: function(features) {
            if (L.Util.isArray(features)) {
                this._sendFeatures(features);
            } else if (arguments.length > 1) {
                this._sendFeatures(arguments);
            } else {
                this._sendFeatures([features]);
            }
        },

        _addMarker: function(f) {

            if (!f.geometry || !f.geometry) {
                console.debug("Received no Feature object");
                return;
            }

            // For GeoJSON standar the first coordinate is the longitude
            // Documentation http://geojson.org/geojson-spec.html#positions
            var markerLocation;
            if (L.Util.isArray(f.geometry.coordinates)) {
                markerLocation = new L.LatLng(f.geometry.coordinates[1], f.geometry.coordinates[0]);
            } else {
                markerLocation = new L.LatLng(f.geometry.coordinates.latitude, f.geometry.coordinates.longitude);
            }

            var marker = new L.Marker(markerLocation);
            // We store this here so is avalaible later, on restylings because of zoom changes.
            marker.feature = f;

            var featureId = f[this.options.idField];
            this._markersMap[featureId] = marker;

            this.addLayer(marker);
        },

        /**
         * Method to run when a feature has been clicked
         * @param {object} feature - feature clicked
         */
        onFeatureClicked: function(feature) {
            this.fireEvent("featureClick", feature);
            //alert(feature.properties.name);
        },

        _applyStyles: function(marker, inCluster) {
            if (!marker.feature) {
                this.noClusterGroup.addLayer(marker);
                return;
            }

            var zoom;
            try {
              zoom = this.getMap().getZoom();  
            } catch(e) {
                return;
            }
            var style = this.applyStyle(marker.feature, zoom);
            if (style.icon) {
                marker.setIcon(style.icon);
            }
            if (style.opacity) {
                marker.setOpacity(style.opacity);
            }

            if (inCluster) {
                this.clusterGroup.removeLayer(marker);
            } else {
                this.noClusterGroup.removeLayer(marker);
            }



            if (style.disableClustering) {
                this.noClusterGroup.addLayer(marker);
            } else {
                this.clusterGroup.addLayer(marker);
            }


            this.addPopUp(marker, zoom);
        },

        _onViewChanged: function() {
            var markersCluster = this.clusterGroup.getLayers();
            var markersNoCluster = this.noClusterGroup.getLayers();

            // Recorrer cluster
            var i, marker;
            for (i = 0; i < markersCluster.length; i++) {
                marker = markersCluster[i];
                if (this.clusterGroup) {
                    if (this._slidermove) {
                        marker._slidermove = true;
                    }
                    this._applyStyles(marker, true);
                }
            }

            for (i = 0; i < markersNoCluster.length; i++) {
                marker = markersNoCluster[i];
                if (this.noClusterGroup) {
                    if (this._slidermove) {
                        marker._slidermove = true;
                    }
                    this._applyStyles(marker, false);
                }

            }
        },

        /**
         * Unload a layer's data
         */
        unload: function() {
            if (this.noClusterGroup) {
                this.noClusterGroup.clearLayers();
            }

            if (this.clusterGroup) {
                this.clusterGroup.clearLayers();
            }
        }



    }, [SMC.layers.SingleLayer, SMC.layers.stylers.MarkerCssStyler]);
