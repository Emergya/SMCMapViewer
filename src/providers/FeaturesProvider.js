require("./providers.js");

/**
 * Base class for layer data providers returning arrays of Features.
 * @class
 * @abstract
 * @extends L.Class
 * @mixes L.Mixin.Events
 * @param {SMC.providers.FeaturesProvider~options} options - The configuration for the class
 *
 * @author Luis Román (lroman@emergya.com)
 */
SMC.providers.FeaturesProvider = L.Class.extend(
    /** @lends SMC.providers.FeaturesProvider# */
    {

        includes: L.Mixin.Events,

        /**
         * @typedef {Object} SMC.providers.FeaturesProvider~options
         * @property {string} featureId="id" - The default id to the feature
         */
        options: {
            idField: "id"
        },
        /** 
         * Initialize the class 
         * @param {string} options - The default options to the feature
         */
        initialize: function(options) {
            L.setOptions(this, options);
        },

        /**
         * Retrieves the features from its source.
         * @fires SMC.providers.FeaturesProvider#featuresLoaded
         */
        loadFeatures: function() {
            var tis = this;
            this.doFeaturesLoading().then(function(featureCollection) {
                tis.onFeaturesLoaded(featureCollection.features);
                /**
                 * Features loaded event.
                 *
                 * @event SMC.providers.FeaturesProvider#featuresLoaded
                 * @type {object}
                 * @property {object} features - The loaded features.
                 */
                tis.fire("featuresLoaded", featureCollection.features);
            });
        },


        /**
         * Implementations of FeatureProvider must contain an override of this method, so features can be loaded from their source.
         * @abstract
         */
        doFeaturesLoading: function() {
            throw new Error("FeaturesProvider::doFeaturesLoading must be implemented by derivate classes.");
        },

        /**
         * Implementations or users of FeatureProvider must provide an implementation of this class so retrieved features can be used.
         * @abstract
         * @param {object} features - The features retrieved by the provider.
         */
        onFeaturesLoaded: function(features) {
            throw new Error("FeaturesProvider::onFeaturesLoaded must be implemented by derivate classes.");
        }
    });

/**
 * API factory method for ease creation of features providers.
 * @params {Object} options - Options for the provider.
 */
SMC.featuresProvider = function() {
    return new SMC.providers.FeaturesProvider();
};
