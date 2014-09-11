require("./geometry.js");
require("../SingleLayer.js");
require("./CanvasRenderer.js");
require("../stylers/MapCssStyler.js");
require("../../../lib/canvasLayer/leaflet_canvas_layer.js");
/**
 * Base class for layers using client side rendering of geographical features in the SCM map viewer component.
 * @class
 * @abstract
 * @extends L.CanvasLayer
 * @mixes SMC.layers.SingleLayer
 * @mixes SMC.layers.geometry.CanvasRenderer
 *
 * @author Luis Román (lroman@emergya.com)
 */
SMC.layers.geometry.GeometryLayer = L.CanvasLayer.extend(
	/** @lends SMC.layers.geometry.GeometryLayer# */
	{

		features: [],
		/**
		 * Initialize the object with the params
		 * @param {object} options - object with need parameters
		 */
		initialize: function(options) {
			L.CanvasLayer.prototype.initialize.apply(this, arguments);
			SMC.layers.stylers.MapCssStyler.prototype.initialize.apply(this, arguments);
			SMC.layers.SingleLayer.prototype.initialize.apply(this, arguments);
			L.Util.setOptions(this, options);
		},
		/**
		 * Method to load the control in the map
		 * @param {SMC.Map} map - Map to be added
		 */
		onAdd: function(map) {

			L.CanvasLayer.prototype.onAdd.call(this, map);
			SMC.layers.SingleLayer.prototype.onAdd.call(this, map);
			// map.fire('layeradd', {
			// 	layer: this
			// });

			map.on("popupopen", function(event) {
				var d = event.target._panAnim;
				if (d && map._autopan) {
					L.DomUtil.setPosition(this._canvas, {
						x: -d._newPos.x,
						y: -d._newPos.y
					});
					map._autopan = false;
				}

			}, this);

			map.on("autopanstart", function() {
				map._autopan = true;
			}, this);


			map.on("resize", function(event) {
				var d = event.target.dragging._draggable._element._leaflet_pos;
				if (d) {
					L.DomUtil.setPosition(this._canvas, {
						x: -d.x,
						y: -d.y
					});
				}
			}, this);

			map.on("slidermove", function(event) {
				var d = event.target.dragging._draggable._element._leaflet_pos;
				if (d) {
					L.DomUtil.setPosition(this._canvas, {
						x: -d.x,
						y: -d.y
					});
				}
			}, this);

		},

		/**
		 * Method to load the control in the map
		 * @param {SMC.Map} map - Map to be removed
		 */
		onRemove: function() {
			SMC.layers.geometry.CanvasRenderer.prototype.onRemove.call(this);
			L.CanvasLayer.prototype.onRemove.apply(this, arguments);
		},

		/**
		 * Method to get the map
		 * @returns {SMC.Map} map - Map layer
		 */
		getMap: function() {
			return this._map;
		},

		/**
		 * Method to render a layer on the map
		 */
		render: function() {
			var canvas = this.getCanvas();

			if (this.features.length !== 0) {
				this.renderCanvas({
					canvas: canvas
				}, this.features, this._map);
			}
		},

		/**
         * Method to add geometries from features
         * @param {object} features - Features to get its geometries
         */
		addGeometryFromFeatures: function(features) {
			if (L.Util.isArray(features)) {
				this.features = features;
			} else if (arguments.length > 1) {
				this.features = arguments;
			} else {
				this.features = [features];
			}

			for (var i = 0; i < this.features.length; i++) {
				this._setProperties(this.features[i]);
			}

			SMC.layers.geometry.CanvasRenderer.prototype.initialize.call(this, this.options);
			this.render();
		},

		_setProperties: function(feature) {
			var id = this.options.idField;
			if (feature.hasOwnProperty(id))
				feature.id = feature[id];
			else {

				for (var propKey in feature) {
					if (feature[propKey].hasOwnProperty(id)) {
						feature.id = feature[propKey][id];
					}
				}

			}
		},

		/**
		 * Method to update the style of a feature
		 * @param {object} feature - feature to be updated
		 */
		updateFeature: function(feature) {
			for (var i = 0; i < this.features.length; i++) {
				if (this.features[i].id == feature.id) {
					feature._clean = false;
					this.features[i] = feature;
				}
			}
			this.render();

		}


	}, [SMC.layers.SingleLayer, SMC.layers.geometry.CanvasRenderer]);