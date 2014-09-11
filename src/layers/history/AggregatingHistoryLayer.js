require("./history.js");
require("./DataHistoryLayer.js");
/**
 * Class formed by the aggregation of several history layers.
 *
 * @class
 * @extends SMC.aggregation.AggregatingLayer
 *
 * @author Luis Román (lroman@emergya.com)
 */
SMC.layers.history.AggregatingHistoryLayer = SMC.layers.aggregation.AggregatingLayer.extend(
	/** @lends SMC.layers.history.AggregatingHistoryLayer# */
	{

		options:{
			time: 1000
		},


		initialize: function(options) {
			SMC.layers.aggregation.AggregatingLayer.prototype.initialize.apply(this, arguments);
			SMC.layers.history.DataHistoryLayer.prototype.initialize.call(this, arguments);
			
		},

		/**
		 * Adds a sublayer to the layer.
		 * @param {string} layerId - Layer Identifier
		 * @param {SMC.layers} layer - Layer object
		 */
		addTimeData: function(time, data){
			throw new Error("Unimplemented method!");
			
		},

		/**
         * Method to load the layer on the map
         */
		load: function(){
			
		},

		/**
         * Method to load the control in the map
         * @param {SMC.Map} map - Map to be added
         */
		onAdd: function(map) {	
			SMC.layers.history.DataHistoryLayer.prototype.onAdd.call(this, map);
            SMC.layers.aggregation.AggregatingLayer.prototype.onAdd.call(this, map);
                     
        },

        /**
         * Method to load the control in the map
         * @param {SMC.Map} map - Map to be removed
         */
        onRemove: function(map){
        	SMC.layers.history.DataHistoryLayer.prototype.onRemove.call(this, map);
        	SMC.layers.aggregation.AggregatingLayer.prototype.onRemove.call(this, map);
        }

	}, [SMC.layers.history.DataHistoryLayer]);