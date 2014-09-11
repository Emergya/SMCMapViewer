require("./aggregation.js");
require("../../controls/layerTree/LayerTreeFolder.js");
require("../../LayerLoader.js");

/**
 * Class formed by the aggregation of several layers.
 *
 * @class
 * @extends SMC.layers.Layer
 *
 * @author Luis Román (lroman@emergya.com)
 */
SMC.layers.aggregation.AggregatingLayer = L.LayerGroup.extend(
	/** @lends SMC.layers.aggregation.AggregatingLayer# */
	{

		_aggregatingLayers: {},

		initialize: function(options) {
			L.Util.setOptions(this, options);
			this._aggregatingLayers = {};

		},

		/**
		 * Adds a sublayer to the layer.
		 * @param {string} layerId - Layer Identifier
		 * @param {SMC.layers} layer - Layer object
		 */
		addLayer: function(layerId, layer) {

			if (layerId.layersConfig) {
				// We use the LayerLoader functionality.
				this.loadLayers(layerId.layersConfig);


			} else if (typeof layerId === "object") {
				console.log(layerId.options.typeName || layerId.options.label);
				this._aggregatingLayers[layerId.options.label || layerId.options.typeName] = layerId;

			}

		},

		/**
		 * Method to get the map
		 * @returns {SMC.Map} map - Map layer
		 */
		getMap: function() {
			if (this.parent) {
				if (this.parent.map) {
					map = this.parent.map;
				} else if (this.parent.parent) {
					if (this.parent.parent.map)
						map = this.parent.parent.map;
					else if (this.parent.parent._map)
						map = this.parent.parent._map;
				}

				return map;
			}
		}

		// onAdd: function(map) {
		// 	L.LayerGroup.prototype.onAdd.call(this, map);

		// },

		// onRemove: function(map){
		// 	L.LayerGroup.prototype.onRemove.call(this, map);
		// },

		// addTo: function(map){
		// 	L.LayerGroup.prototype.addTo.call(this, map);
		// }



	}, [SMC.LayerLoader]);