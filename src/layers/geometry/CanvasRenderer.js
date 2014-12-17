require("../stylers/MapCssStyler.js");
/**
 * Global variable that represents paper library functionality
 * @property {paper} - paper variable
 */
var paper = require("../../../lib/paper/dist/paper-full.js").exports;
var rbush = require("../../../lib/rbush.js");

/**
 * Base class for layers using client side rendering of canvas renderer.
 * @class
 * @abstract
 * @extends L.Class
 * @mixes SMC.layers.stylers.MapCssStyler
 * @param {SMC.layers.geometry.CanvasRenderer~options} options - The configuration for the class
 *
 * @author Luis Román (lroman@emergya.com)
 */
SMC.layers.geometry.CanvasRenderer = L.Class.extend(
    /** @lends SMC.layers.geometry.CanvasRenderer# */
    {

        canvasTree: null,

        // This map will be used to store ctx related events, of which exist one per canvas,
        // so we are able of removing them to avoid performance regressions.
        _ctxEvents: null,

        /**
         * @typedef {Object} SMC.layers.geometry.CanvasRenderer~options
         * @property {boolean} draggingUpdates=true - Default dragging updates value
         */
        options: {
            draggingUpdates: true,
            mouseOver: false,
			debug: false
        },

        /**
         * Initialize the object with the params
         * @param {object} options - object with need parameters
         */
        initialize: function(options) {
            SMC.layers.stylers.MapCssStyler.prototype.initialize.apply(this, arguments);

            L.Util.setOptions(this, options);
            this.fireEvent('layerLoad', {
                features: this.features
            });
        },

        _onMapClicked: function(event) {

            if (this.canvasTree) {

                var canvasBbox = this._searchCanvas(event);
                for (var i = 0; i < canvasBbox.length; i++) {
                    var ctx = canvasBbox[i].ctx;
                    this._onMouseClick(ctx, event);
                }
            }
        },

        _onMapMoveEnded: function() {
            if (this.canvasTree) {
                this.canvasTree.clear();
            }
            map.fireEvent("dragend");
        },

        _onMapDragStarted: function() {
            this.dragging = true;
            if (this.canvasTree) {
                this.canvasTree.clear();
            }

            console.debug("moving disabled!");
            map.off("mousemove", this._onMapMouseMoved, this);
        },

        _onMapMouseMoved: function(event) {
            if (this.canvasTree) {
                this._onMouseMoveAux(event);
            }
        },

        _onMouseMoveAux: function(event) {



            if (this.dragging || !this.options.mouseOver) {
                return;
            }

            var canvasBbox = this._searchCanvas(event);
            console.debug("Mouse move canvases searched: " + canvasBbox.length);
            for (var i = 0; i < canvasBbox.length; i++) {
                var ctx = canvasBbox[i].ctx;
                this._onMouseMove(ctx, event);

            }
        },


        /**
         * Method to render a layer with canvas component
         * @param {object} ctx - canvas context
         * @param {object} features - object that represents a features set
         * @param {SMC.Map} map - map where load the features
         * @returns {SMC.layers.Layer} layer to show on the map
         */
        renderCanvas: function(ctx, features, map) {

            this._initCtx(ctx, map);
            var zBuffer = [];

            if (!this.options.draggingUpdates && this.dragging) {
                // We don't draw while dragging, as it eats A LOT of CPU.
                return;
            }

            ctx.features = features;

            this.labels = [];
            var canvas = ctx.canvas;

            var mypaper;
            if (!canvas._paper) {
                mypaper = new paper.PaperScope();
                mypaper.setup(canvas);
                canvas._paper = mypaper;
                canvas._map = map;

            }

            mypaper = canvas._paper;

            if (canvas._initialized) {
                mypaper.activate();
                mypaper.project.activeLayer.removeChildren();
            }

            var canvasLabel;
            if (ctx.tile) {
                canvasLabel = "(" + ctx.tile.x + " , " + ctx.tile.y + ")";
            } else {
                canvasLabel = mypaper._id;
            }

            console.time("render " + canvasLabel);



            if (ctx.tile) {
                ctx.canvas._s = ctx.tile.multiplyBy(ctx.canvas.width);
            } else {
                ctx.canvas._s = ctx.canvas._map.getPixelBounds().min;
            }

            console.time("applyStyles " + canvasLabel);

            var layer = new mypaper.Group();
            layer.applyMatrix = false;
            layer.translate(new paper.Point(-ctx.canvas._s.x, -ctx.canvas._s.y));

            var z;
            for (var i = 0; i < features.length; i++) {
                var feature = features[i];

                var styles;
                if (feature._clean && !ctx.forceStyles) {
                    styles = feature._styles;
                } else {
                    styles = feature._styles = this._applyStyles(feature, ctx);
                }

                z = {
                    style: styles,
                    zIndex: styles.zIndex,
                    feature: feature
                };

                zBuffer.push(z);
            }

            zBuffer.sort(function(f1, f2) {
                return f1.zIndex - f2.zIndex;
            });

            var items = [];

            for (i = 0; i < zBuffer.length; i++) {
                z = zBuffer[i];
                var item = this._addFeature(ctx, z);
                items.push(item);

                if (z.feature.selected) {
                    item.selected = true;
                }
            }

            layer.addChildren(items);

            console.timeEnd("applyStyles " + canvasLabel);

            console.time("draw " + canvasLabel);

            // Visual debug info:

            if (this.options.debug) {
                var text = new mypaper.PointText({
                    point: [5, 10],
                    content: canvasLabel,
                    fillColor: 'red',
                    fontFamily: 'Courier New',
                    fontWeight: 'bold',
                    fontSize: 10
                });

                var border = new mypaper.Path.Rectangle(0, 0, canvas.clientWidth, canvas.clientHeight);
                border.style.strokeColor = "gray";

            }

            mypaper.view.draw();

            console.timeEnd("draw " + canvasLabel);
            console.timeEnd("render " + canvasLabel);

            return layer;
        },

        _initCtx: function(ctx, map) {

            if (ctx.canvas._initialized) {
                return;
            }

            ctx.canvas._initialized = true;

            if (!map) {
                map = this.getMap();
            }
            var zoom = map.getZoom();
            if (this.canvasTree === null || this.lastZoom != zoom) {
                this.canvasTree = rbush(9, ['.minx', '.miny', '.maxx', '.maxy']);
                this.lastZoom = zoom;
            }

            var treeNode = this._createTreeNode(ctx);
            this.canvasTree.insert(treeNode);

            this._registerCtxEvent("zoomend", function() {
                this._onViewChanged(ctx);
            });


            this._registerCtxEvent("dragend", function() {
                this.dragging = false;

                console.debug("moving renabled!");
                map.on("mousemove", this._onMouseMoveAux, this);

                var treeNode = this._createTreeNode(ctx);
                this.canvasTree.insert(treeNode);

                if (!this.options.draggingUpdates) {
                    this.renderCanvas(ctx, ctx.features, ctx.canvas._map);
                }
            });
        },

        _registerCtxEvent: function(eventName, fn) {
            if (!this._ctxEvents) {
                this._ctxEvents = {};
            }

            if (!this._ctxEvents[eventName]) {
                this._ctxEvents[eventName] = [];
            }

            this._ctxEvents[eventName].push(fn);

            var map = this.getMap();
            if (!map && this.parent) {
                if (this.parent._map) {
                    map = this.parent._map;
                } else if (this.parent.parent) {
                    map = this.parent.parent._map;
                }
            }

            map.on(eventName, fn, this);
        },

        _createTreeNode: function(ctx) {
            var points = ctx.canvas.getBoundingClientRect();
            var bbox = L.bounds([points.top, points.left], [points.bottom, points.right]);


            return {
                ctx: ctx,
                minx: bbox.min.x,
                maxx: bbox.max.x,
                miny: bbox.min.y,
                maxy: bbox.max.y,
                tilePoint: ctx.tile
            };

        },

        _searchCanvas: function(event) {
            var bbox = L.bounds([event.containerPoint.y, event.containerPoint.x], [event.containerPoint.y,
                event.containerPoint.x
            ]);


            var canvas = [];
            if (this.canvasTree) {
                canvas = this.canvasTree.search([bbox.min.x, bbox.min.y, bbox.max.x, bbox.max.y]);
            }

            return canvas;
        },


        _addFeature: function(ctx, elem) {
            var feature = elem.feature;

            if (feature._clean) {
                return feature._item;
            }

            var styles = elem.style;

            var geom = feature.geometry.coordinates;
            if (geom[0]) {
                while (L.Util.isArray(geom[0][0])) {
                    geom = geom[0];
                }
            }

            var labels = this._addLabels(feature, ctx);
            var stylePopup = this._addPopUp(feature, ctx);


            var type = feature.geometry.type;

            var item, path;
            switch (type) {
                case 'Point':
                case 'MultiPoint':

                    var point = this._canvasPoint(geom, ctx, feature._clean);
                    styles.path.position = point;
                    path = styles.path;

                    break;

                case 'LineString':
                case 'MultiLineString':

                    path = this._createGeometry(ctx, geom, feature, styles.offset, feature._clean);
                    break;

                case 'Polygon':
                case 'MultiPolygon':

                    path = this._createGeometry(ctx, geom, feature, null, feature._clean);
                    path.closed = true;

                    break;

            }


            feature._clean = true;
            path._feature = feature;
            item = this._createItem(path, styles, labels, stylePopup, ctx);
            feature._item = item;
            return item;

        },

        _getCtxId: function(ctx) {

            if (ctx.id) {
                return ctx.id;
            }



            if (ctx.tile) {
                ctx.id = ctx.tile.x + ":" + ctx.tile.y;
            } else {
                ctx.id = "ctx"; // Just one ctx anyway so any id should work.
            }

            return ctx.id;
        },

        _canvasPoint: function(coords, ctx, clean) {

            // actual coords to tile 'space'
            var p;
            var zoom = ctx.zoom;
            if (coords._projCoords && clean) {
                p = coords._projCoords;
            } else {
                p = coords._projCoords = ctx.canvas._map.project(new L.LatLng(coords[1], coords[0]), zoom);
            }

            return {
                x: p.x,
                y: p.y
            };
        },



        _createGeometry: function(ctx, geom, feature, offset, clean) {
            var path; // = new ctx.paper.Path();

            var points = [];
            for (var i = 0; i < geom.length; i++) {
                points[i] = this._canvasPoint(geom[i], ctx, clean);

            }
            points = L.LineUtil.simplify(points, 1);

            if (offset && offset !== 0) {
                points = this._addOffset(points, offset, ctx);
            }

            path = new ctx.canvas._paper.Path({
                segments: points
            });

            return path;

        },


        _applyStyles: function(feature, ctx) {
            var zoom = ctx.canvas._map.getZoom();
            var style = this.applyStyle(feature, ctx, zoom);
            return style;
        },

        _addLabels: function(feature, ctx) {
            var zoom = ctx.canvas._map.getZoom();
            var label = this.addLabelStyle(feature, zoom);
            return label;

        },

        _addPopUp: function(feature, ctx) {
            var zoom = ctx.canvas._map.getZoom();
            var popUpStyle = this.addPopUp(feature, zoom);
            return popUpStyle;
        },

        _createItem: function(path, styles, labels, stylePopup, ctx) {

            path.style = styles.pathStyle;
            path.opacity = styles.opacity;
            path.visible = styles.visible;
            if (typeof styles.visible === "undefined") {
                path.visible = true;
            }
            path._feature.stylePopup = stylePopup;


            var item = new ctx.canvas._paper.Group();
            item.addChild(path);
            item.zIndex = styles.zIndex;

            if (labels.content && path.visible) {
                var pointText = new ctx.canvas._paper.PointText(path.interiorPoint);
                pointText.content = labels.content;
                pointText.style = labels.style;
                item.addChild(pointText);
            }

            return item;
        },

        _onMouseClick: function(ctx, event) {

            var popup;
            var hitResult = this._hitTest(ctx, event);

            if (hitResult && hitResult.item._class == 'Path') {
                event._hit = hitResult;

                this.fireEvent("featureClick", {
                    feature: hitResult.item._feature,
                    event: event,

                });


                this.updateFeature(hitResult.item._feature);
                var stylePopup = this._addPopUp(hitResult.item._feature, ctx);

                if (stylePopup.content != null) {

                    popup = L.popup({
                            offset: stylePopup.offset
                        })
                        .setLatLng(event.latlng)
                        .setContent(stylePopup.content)
                        .openOn(ctx.canvas._map);
                }
            }

        },

        _onMouseMove: function(ctx, event) {

            var hitResult = this._hitTest(ctx, event);

            if (hitResult && hitResult.item._class == 'Path') {
                event._hit = hitResult;
            }

            ctx.canvas._map.getContainer().style.cursor = event._hit ? 'pointer ' : '';
        },


        _hitTest: function(ctx, event) {

            //console.time("hitTest");
            var cPoint = this._canvasPoint([event.latlng.lng, event.latlng.lat], ctx);

            var s = ctx.canvas._map.getPixelBounds().min;


            cPoint.x -= ctx.canvas._s.x;
            cPoint.y -= ctx.canvas._s.y;
            var fill = true;

            var options = {
                tolerance: 10,
                fill: true,
                stroke: true
            };


            var hitResult = ctx.canvas._paper.project.hitTest(cPoint, options);
            //console.timeEnd("hitTest");

            return hitResult;
        },

        _onViewChanged: function(ctx) {
            for (var i = 0; i < this.features.length; i++) {
                var f = this.features[i];
                f._clean = false;
                this.canvasTree.clear();
            }

        },

        _addOffset: function(proj, offset, ctx) {
            var points = [];
            for (var j = 0; j < proj.length; j++) {
                var p = proj[j];

                p.lat = p.x;
                p.lng = p.y;

                if (j === 0) {
                    nextPoint = proj[j + 1];
                    normal = this._calculateNormal(p, nextPoint);
                    p.x = p.x + offset * normal.x;
                    p.y = p.y + offset * normal.y;
                } else if (j == proj.length - 1) {
                    prevPoint = proj[j - 1];
                    normal = this._calculateNormal(prevPoint, p);
                    p.x = p.x + offset * normal.x;
                    p.y = p.y + offset * normal.y;
                } else {

                    prevPoint = proj[j - 1];
                    normal0 = this._calculateNormal(prevPoint, p);

                    var x1 = prevPoint.x + offset * normal0.x;
                    var y1 = prevPoint.y + offset * normal0.y;

                    var x2 = p.x + offset * normal0.x;
                    var y2 = p.y + offset * normal0.y;

                    nextPoint = nextPoint = proj[j + 1];
                    normal1 = this._calculateNormal(p, nextPoint);
                    var x3 = p.x + offset * normal1.x;
                    var y3 = p.y + offset * normal1.y;

                    var x4 = nextPoint.x + offset * normal1.x;
                    var y4 = nextPoint.y + offset * normal1.y;


                    var d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

                    if (d < 0.000000000001) {
                        // Very small denominators make the calculation go crazy.
                        p.x = p.x + offset * normal.x;
                        p.y = p.y + offset * normal.y;
                    } else {

                        var n1 = (x1 * y2 - y1 * x2);
                        var n2 = (x3 * y4 - y3 * x4);

                        p.x = (n1 * (x3 - x4) - (x1 - x2) * n2) / d;
                        p.y = (n1 * (y3 - y4) - (y1 - y2) * n2) / d;

                    }
                }
                proj[j] = {
                    x: p.lat,
                    y: p.lng
                };
                points[j] = {
                    x: p.x,
                    y: p.y
                };


            }


            return points;
        },

        _calculateNormal: function(p0, p1) {

            var ry = p1.y - p0.y;
            var rx = p1.x - p0.x;

            var d = Math.sqrt(rx * rx + ry * ry);

            return {
                x: -ry / d,
                y: rx / d
            };

        },

        /**
         * Method to add a layer from the map
         */
        onAdd: function() {
            this._ctxEvents = {};
            var map = this.getMap();
            map.on("dragstart", this._onMapDragStarted, this);

            map.on("mousemove", this._onMapMouseMoved, this);
            map.on("moveend", this._onMapMoveEnded, this);
            map.on("click", this._onMapClicked, this);

        },

        /**
         * Method to remove a layer from the map
         */
        onRemove: function() {
            // We need to remove all events associated with the layer, or performance will be sorely affected.

            var map = this.getMap();

            map.off("click", this._onMapClicked, this);
            map.off("mousemove", this._onMapMouseMoved, this);
            map.off("dragstart", this._onMapDragStarted, this);
            map.off("moveend", this._onMapMoveEnded, this);

            for (var eventName in this._ctxEvents) {
                var eventHandlers = this._ctxEvents[eventName];
                for (var i = 0; i < eventHandlers.length; i++) {
                    map.off(eventName, eventHandlers[i], this);
                }
            }
        }

    }, [SMC.layers.stylers.MapCssStyler]);