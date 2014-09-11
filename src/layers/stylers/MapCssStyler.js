require("./Styler.js");


/**
 * MapCSS styles parser, for user with SMC Viewer's geometry layers.
 *
 * @class
 * @extends SMC.layers.stylers.Styler
 * @mixin SMC.layers.stylers.MapCssStyler
 *
 * @author Luis Román (lroman@emergya.com)
 */
SMC.layers.stylers.MapCssStyler = SMC.layers.stylers.Styler.extend(
    /** @lends SMC.layers.stylers.MapCssStyler# */
    {
        /**
         * @property {Array} labels - The labels array
         * @default null
         */
        labels: [],
        /**
         * Initialize the object with the params
         * @param {object} options - default options
         */
        initialize: function(options) {
            this._parser_url = SMC.BASE_URL + "resources/parser.txt";
            SMC.layers.stylers.Styler.prototype.initialize.apply(this, arguments);
        },

        /**
         * Adds style properties to the received features, so the can be represented as intended by the style for the layer.
         * @param {object} feature - An object that represents the geometry element being styled.
         * @param {object} ctx - An object that represents the context function.
         * @param {string} zoom - Number that represents the level zoom to apply the style.
         * @returns {object} style from the feature
         */
        applyStyle: function(feature, ctx, zoom) {

            var style = this._createStyles(feature, zoom);
            if (!style)
                style = "";

            var path;
            if (feature.geometry.type == 'Point' || feature.geometry.type == 'MultiPoint') {
                switch (style.symbol) {
                    case 'Circle':
                        path = new ctx.canvas._paper.Path.Circle({
                            radius: style.radius || 3
                        });
                        break;

                    case 'Rectangle':
                        path = new ctx.canvas._paper.Path.Rectangle({
                            size: style.size || [10, 10]
                        });
                        break;

                    case 'Ellipse':
                        path = new ctx.canvas._paper.Path.Ellipse({
                            size: style.size || [10, 8]
                        });
                        break;

                    case 'RegularPolygon':
                        path = new ctx.canvas._paper.Path.RegularPolygon({
                            sides: style.sides || 3,
                            radius: style.radius || 5
                        });
                        break;

                    case 'Star':
                        path = new ctx.canvas._paper.Path.Star({
                            points: style.points || 5,
                            radius1: style.radius1 || 3,
                            radius2: style.radius2 || 5
                        });
                        break;
                    default:
                        path = new ctx.canvas._paper.Path.Circle({
                            radius: 3
                        });
                        break;

                }


            }


             var pathStyle = {
                strokeColor: style.strokeColor || style.fillColor || "black",
                strokeWidth: style.strokeWidth || 2,
                strokeJoin: style.strokeJoin || 'miter',
                dashArray: style.dashArray || [],
                strokeCap: style.strokeCap || 'butt',
                dashOffset: style.dashOffset || 0,
                miterLimit: style.miterLimit || 10,
                windingRule: style.windingRule || 'nonzero',
                selectedColor: style.selectedColor || 'aqua',
                shadowColor: style.shadowColor || 'black',
                shadowBlur: style.shadowBlur || 0,
                shadowOffset: style.shadowOffset || []

            };


            if (feature.geometry.type == 'LineString' || feature.geometry.type == 'MultiLineString') {
                pathStyle.strokeColor = style.strokeColor || "black";
                 pathStyle.fillColor = null;
            } else {
                pathStyle.fillColor = style.fillColor || 'rgba(0,0,0,0)'
            }

            var opacity = style.opacity ? style.opacity : 1;
            var offset = style.offset ? style.offset : 0;
            var zIndex = style.zIndex ? style.zIndex : 0;
            var visible = !style.invisible ? true : false;
            var popUpStyle = {
              popUpTemplate: style.popUpTemplate,
              popUpUrl: style.popUpUrl,
              noPopUp: style.noPopUp,
              offsetLeft: style.popUpOffsetLeft,
              offsetTop: style.popUpOffsetTop
            }

            feature._styles = {
                popUpStyle: popUpStyle,
                pathStyle: pathStyle,
                opacity: opacity,
                path: path,
                offset: offset,
                zIndex: zIndex,
                visible: visible
            };
            return feature._styles;
        },

        /**
         * Adds style label to the received features, so the can be represented as intended by the style for the layer.
         * @param {object} feature - An object that represents the geometry element being styled.
         * @param {string} zoom - Number that represents the level zoom to apply the style.
         * @returns {objects} style from feature label
         */
        addLabelStyle: function(feature, zoom) {

            var labelStyle = this._createLabel(feature, zoom);


            var content;
            if (labelStyle.content) {
                if (labelStyle.uniqueLabel) {

                    if (!this.labels.length) {
                        this.labels.push(labelStyle.content);
                        content = labelStyle.content;
                    } else {
                        var i = 0;
                        var exists = false;
                        while ((i < this.labels.length) && !exists) {
                            if (labelStyle.content == this.labels[i]) {
                                exists = true;
                            }
                            i++;
                        }
                        if (!exists) {
                            this.labels.push(labelStyle.content);
                            content = labelStyle.content;
                        }
                    }


                } else
                    content = labelStyle.content;
            }

            var style = {
                defaultPopUp: true,
                fillColor: labelStyle.fillColor || 'black',
                fontFamily: labelStyle.fontFamily || 'sans-serif',
                fontWeight: labelStyle.fontWeight || 'normal',
                fontSize: labelStyle.fontSize || 10,
                leading: labelStyle.leading || labelStyle.fontSize * 1.2,
                shadowColor: labelStyle.shadowColor || 'black',
                shadowBlur: labelStyle.shadowBlur || 0,
                shadowOffset: labelStyle.shadowOffset || []
            };

            return {
                content: content,
                style: style
            };
        },

        _createLabel: function(feature, zoom) {
            return {
                labelStyle: null
            };
        },

        /**
         * Adds style popup to the received features, so the can be represented as intended by the style for the layer.
         * @param {object} feature - An object that represents the geometry element being styled.
         * @param {string} zoom - Number that represents the level zoom to apply the style.
         * @returns {object} style from feature popup
         */
        addPopUp: function(feature, zoom) {
            var style = feature._styles.popUpStyle;
            var offsetLeft = style.offsetLeft || 0;
            var offsetTop = style.offsetTop || 0;


            var content, propKey;
            var data = {};
            if (style.popUpTemplate) {
                content = this._contentFromTemplate(feature, style.popUpTemplate);
            } else if (style.popUpUrl) {
                content = "<iframe src=" + style.popUpUrl + "/>";

            } else if (style.noPopUp) {
                content = null;

            } else {
                // Default template, one entry per field
                content = this._contentFromTemplate(feature, "");
            }
            var offset = [offsetLeft, offsetTop];

            return {
                content: content,
                offset: offset
            };
        }
    });
