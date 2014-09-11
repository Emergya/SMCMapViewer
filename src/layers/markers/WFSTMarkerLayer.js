require("./MarkerLayer");
require("../../providers/WFSTProvider.js");
require("../EditableLayer");
require("../../../lib/leaflet.draw/dist/leaflet.draw-src.js");
var editable_layers = [];
/**
 * Layer for all SMC map viewer's WFS-T layers rendered using markers.
 * @class
 * @extends SMC.layers.markers.MarkerLayer
 * @mixes SMC.providers.WFSTProvider
 * @mixes SMC.layers.EditableLayer
 *
 * @author Moisés Arcos (marcos@emergya.com)
 */
SMC.layers.markers.WFSTMarkerLayer = SMC.layers.markers.MarkerLayer.extend(
	/** @lends SMC.layers.markers.WFSTMarkerLayer# */
	{
		/**
         * Initialize the object with the params
         * @param {object} options - object with need parameters
         */
        initialize: function(options) {
            SMC.layers.markers.MarkerLayer.prototype.initialize.call(this, options);
            SMC.providers.WFSTProvider.prototype.initialize.call(this, options);
            SMC.layers.EditableLayer.prototype.initialize.call(this, options);
        },

        /**
         * Method to load the features into marker layer
         * @param {Object} features - Features to be loaded
         */
        onFeaturesLoaded: function(features) {
            this.addMarkerFromFeature(features);
        },

        /**
         * Retrieves the features from its source.
         */
        load: function() {
            this.loadFeatures();
        },

        /**
         * Method to create an HTML node for the name of the layer.
         * @returns {String} HTML code representing the code to be added to the layer's entry in the layer tree.
         */
        createNodeHTML: function() {
            var node = this._addEditButton();
            if(node == null){
                node = this.options.label || this.options.typeName;
            }
            return node;
        },

        /**
         * Method to load the control in the map
         * @param {SMC.Map} map - Map to be added
         */
        onAdd: function(map){
            editable_layers.push(this);
            SMC.layers.markers.MarkerLayer.prototype.onAdd.call(this, map);
        },
        
        /**
         * Method to remove the control in the map
         * @param {SMC.Map} map - Map to be removed
         */
        onRemove: function(map){
            var index = this._getIndexFromEditableLayer(this);
            if(index > -1){
                editable_layers.splice(index, 1);
            }
            SMC.layers.markers.MarkerLayer.prototype.onRemove.call(this, map);
        },

        /**
         * Method to add edit control to map
         * @private
         * @param {Object} options - Event to handler
         */
        _startEditControl: function(options){
            if(this._map && !this._drawControl){
                for(var i=0; i<editable_layers.length; i++){
                    if(editable_layers[i]._leaflet_id != this._leaflet_id){
                        var label = editable_layers[i].options.label;
                        var layer_div = $("[id='" + label + "']")[0];
                        var buttons = $("input[type=button]", layer_div);
                        var check =  $("input[type=checkbox][id=" + editable_layers[i]._leaflet_id + "]")[0];
                        for(j=0; j<buttons.length; j++){
                            if(check.checked && !buttons[j].disabled){
                                buttons[j].disabled = true;
                            }
                        }
                    }
                }
                var self = this;
                // Initialise the draw control and pass it the FeatureGroup of editable layers
                this._drawControl = new L.Control.Draw({
                    draw: {
                        polyline: false,
                        polygon: false,
                        rectangle: false,
                        circle: false
                    },
                    edit: {
                        featureGroup: this.noClusterGroup
                    }
                });
                this._map.addControl(this._drawControl);
                // Marker created
                this._map.on('draw:created', function (e) {
                    var layer = e.layer;
                    self.addLayer(layer);
                    // Update the added features
                    self._insert(layer);
                });
                // Marker edited
                this._map.on('draw:edited', function (e) {
                    var layers = e.layers;
                    // Update the edited features
                    self._update(layers);
                });
                // Marker removed
                this._map.on('draw:deleted', function (e) {
                    var layers = e.layers;
                    // Remove the deleted features
                    self._delete(layers);
                }); 
            }
        },

        /**
         * Method to add edit control to map
         * @private
         * @param {Object} options - Event to handler
         */
        _finishEditControl: function(options){
            if(this._drawControl){
                for(var i=0; i<editable_layers.length; i++){
                    if(editable_layers[i]._leaflet_id != this._leaflet_id){
                        var label = editable_layers[i].options.label;
                        var layer_div = $("[id='" + label + "']")[0];
                        var buttons = $("input[type=button]", layer_div);
                        var check =  $("input[type=checkbox][id=" + editable_layers[i]._leaflet_id + "]")[0];
                        for(j=0; j<buttons.length; j++){
                            if(check.checked){
                                if(buttons[j].disabled){
                                    buttons[j].disabled = false;
                                }
                            }
                        }
                    }
                }
                this._map.removeControl(this._drawControl);
                this._drawControl = null;
            }
        },

        _applyStyles: function(marker, inCluster) {
            if (!marker.feature) {
                this.noClusterGroup.addLayer(marker);
                return;
            }
            
           // var zoom = this._map.getZoom();
            if(!zoom){
               var zoom = this.getMap().getZoom();
            }
            var style = this.applyStyle(marker.feature, zoom);
            if (style.icon) {
                marker.setIcon(style.icon);
            }
             if (style.opacity) {
                marker.setOpacity(style.opacity);
            }
            this.noClusterGroup.removeLayer(marker);
            this.noClusterGroup.addLayer(marker);

            this.addPopUp(marker, zoom);
        },
        _getIndexFromEditableLayer: function(layer){
            var index = -1;
            for(var i=0; i<editable_layers.length; i++){
                if(editable_layers[i]._leaflet_id == layer._leaflet_id){
                    index = i;
                    break;
                }
            }
            return index;
        },
	}, [SMC.layers.EditableLayer, SMC.providers.WFSTProvider]);

/**
 * API factory method for ease creation of wfs features providers.
 * @param {Object} options - Options for wfs the provider.
 */
SMC.wfstMarkerLayer = function(options) {
    return new SMC.layers.markers.WFSTMarkerLayer(options);
};