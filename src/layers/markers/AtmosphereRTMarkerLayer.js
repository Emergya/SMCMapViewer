require("./markers.js");
require("./MarkerLayer.js");
require("../../providers/AtmosphereRTFeatureProvider.js");


/**
 * Marker layer able to retrieve and update its markers from an Atmosphere
 * real time source.
 * @class
 * @extends SMC.layers.markers.MarkerLayer
 * @mixes SMC.providers.AtmosphereRTFeatureProvider
 *
 * @author Luis Román (marcos@emergya.com)
 */
SMC.layers.markers.AtmosphereRTMarkerLayer = SMC.layers.markers.MarkerLayer.extend(
    /** @lends SMC.layers.markers.AtmosphereRTMarkerLayer# */
    {

        _markersMap: {},

        /**
         * Initialize the class with options parameter
         * @param {object} options - default options
         */
        initialize: function(options) {
            SMC.layers.markers.MarkerLayer.prototype.initialize.call(this, options);
            SMC.providers.AtmosphereRTFeatureProvider.prototype.initialize.call(this, options);
        },

        /**
         * Method to load the features into marker layer
         * @param {object} features - features to be loaded
         */
        onFeaturesLoaded: function(features) {
            this.addMarkerFromFeature(features);
        },

        /**
         * Method to remove the features from the map
         * @param {object} features - features to be deleted
         */
        onFeaturesDeleted: function(features) {
            for (var i = 0; i < features.length; i++) {
                var feature = features[i];
                var featureId = feature[this.options.featureId];
                var layer = this._markersMap[featureId];
                this.removeLayer(layer);

                delete this._markersMap[featureId];
            }
        },

        /**
         * Method to set the features from the map
         * @param {object} features - features to be updated
         */
        onFeaturesModified: function(features) {
            this.onFeaturesDeleted(features);
            this.onFeaturesLoaded(features);
        },

        /**
         * Retrieves the features from its source.
         */
        load: function() {
            this.loadFeatures();
        },

        /**
         * Implementations of FeatureProvider must contain an override of this method, so features can be loaded from their source.
         * @abstract
         */
        doFeaturesLoading: function() {
            return $.Deferred();
        },


    }, [SMC.providers.AtmosphereRTFeatureProvider]);
/**
 * API factory method for ease creation of atmosphere powered realtime marker layers.
 * @param {Object} options - Options for the marker layer and Atmosphere provider.
 */
SMC.atmosphereRTMarkerLayer = function(options) {
    return new SMC.layers.markers.AtmosphereRTMarkerLayer(options);
};
