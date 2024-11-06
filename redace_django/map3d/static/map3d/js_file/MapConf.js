/**
 * マップに関する関数群
 */

var map;
var roots = {};
var wms_layers = {};
wms_layers.json = {};
wms_layers.ratio = {};
var terrainProvider_set;
var terrainProvider_elli;
var layer_check;
var cartesian_event;
var cricle_dis = 300;
var firstinfo = false;

//rgb(255, 165, 0)　オレンジ
//rgb(250, 210, 107) 黄色オレンジ-->goldenrod rgb(218, 165, 32)
//#d9d9d9　白グレー
//rgb(0, 128, 0) 緑
//#00BCD4 水色 ,--> aqua rgb(0, 255, 255)

/**
 * グラフエリア
 */
$(function () {
    let graphTabColor1, graphTabColor2, graphTabColor3;
    let backColor = 'background-color';
    let aqua = 'rgb(0, 255, 255)';
    let goldenrod = 'rgb(218, 165, 32)';
    let gray = '#d9d9d9';

    function getGraphTabColor() {
        graphTabColor1 = $('#graph_tab1').css(backColor);
        graphTabColor2 = $('#graph_tab2').css(backColor);
        graphTabColor3 = $('#graph_tab3').css(backColor);
    }
    function changeGraphTab(tabClicked, tabClickedColor, tabLeft, tabLeftColor, tabRight, tabRightColor) {
        if (tabClickedColor == aqua) {
        } else if (tabClickedColor == goldenrod) {
            $(tabLeft).css(backColor, gray);
            $(tabRight).css(backColor, gray);
        } else {
            if (tabLeftColor == goldenrod || tabRightColor == goldenrod) {
                tabLeftColor == aqua ? $(tabLeft).css(backColor, gray) : $(tabRight).css(backColor, gray);
            } else {
                tabLeftColor == aqua ? $(tabLeft).css(backColor, goldenrod) : $(tabRight).css(backColor, goldenrod);
            }
        }
        $(tabClicked).css(backColor, aqua);
    }

    $('#graph_tab1').click(function () {
        getGraphTabColor();
        changeGraphTab('#graph_tab1', graphTabColor1, '#graph_tab2', graphTabColor2, '#graph_tab3', graphTabColor3);
        if (chartList.length > 0) chartList[0].resize();
    });
    $('#graph_tab2').click(function () {
        getGraphTabColor();
        changeGraphTab('#graph_tab2', graphTabColor2, '#graph_tab1', graphTabColor1, '#graph_tab3', graphTabColor3);
        if (chartList.length > 1) chartList[1].resize();
    });
    $('#graph_tab3').click(function () {
        getGraphTabColor();
        changeGraphTab('#graph_tab3', graphTabColor3, '#graph_tab1', graphTabColor1, '#graph_tab2', graphTabColor2);
        if (chartList.length > 2) chartList[2].resize();
    });

    // 補助情報のダウンロード
    $('iframe').on('load', function () {
        // $(this).contents().on('mousemove', onMouseMove);
        // $(this).contents().on('mouseup', onMouseUP);
        // $(this).contents().on('click', infoBox_z);
        $(this).contents().on('click', '#anc_dl_xlsx', downloadAncXLSX);
        $(this).contents().on('click', '#anc_dl_csv', downloadAncCSV);
        $(this).contents().on('click', '#anc_dl_json', downloadAncJSON);
        $(this).contents().on('click', '#anc_dl_pvl', downloadAncPVL);
    });
});

/**
 * 火星マップに関すること
 */
function init_map() {
    var baselayer;
    var userSetbaselayer;
    var OriginBaselayer;
    var OriginBaselayer2;

    var MOLA_THEMIS_blend_Layer = new Cesium.WebMapServiceImageryProvider({
        url: 'http://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map',
        layers: 'MOLA_THEMIS_blend',
        proxy: new Cesium.DefaultProxy('/proxy'),
        parameters: {
            format: 'image/png',
        },
    });
    var ellipsoid = new Cesium.Ellipsoid(3396190.0, 3396190.0, 3396190.0);

    terrainProvider_set = new Cesium.CesiumTerrainProvider({
        url: Network_terrainserver,
        // url: 'http://192.168.1.14/redace_terrain/tilesets/mars',
        // url: 'http://192.168.1.14:9000/tilesets/LDEM_GDR',
        // url: 'http://192.168.1.14:8888'
        // ellipsoid:mars_ellipsoid,
        // requestVertexNormals:true,
        ellipsoid: ellipsoid,
    });

    roots.map = new Cesium.Viewer('map', {
        // 起伏設定部分
        terrainProvider: terrainProvider_set,
        terrainExaggeration: 2.0, // なぜか1だと変になる。

        skyAtmosphere: new Cesium.SkyAtmosphere(new Cesium.Ellipsoid(3372090.0, 3372090.0, 3372090.0)),

        imageryProvider: MOLA_THEMIS_blend_Layer,
        mapProjection: new Cesium.GeographicProjection(ellipsoid),

        timeline: false,
        animation: false,
        baseLayerPicker: false,
        geocoder: false,
        infoBox: true,
        navigationHelpButton: false,
        selectionIndicator: false,
        vrButton: true,
    });
    roots.map.scene.skyAtmosphere.hueShift = 0.5;
    roots.map.scene.fog.enabled = false;

    terrainProvider_elli = new Cesium.EllipsoidTerrainProvider({
        ellipsoid: ellipsoid,
    });

    var imageryLayers = roots.map.imageryLayers;

    viewModel = {
        layers: [],
        baseLayers: [],
        upLayer: null,
        downLayer: null,
        selectedLayer: null,
        isSelectableLayer: function (layer) {
            return this.baseLayers.indexOf(layer) >= 0;
        },
        raise: function (layer, index) {
            imageryLayers.raise(layer);
            viewModel.upLayer = layer;
            viewModel.downLayer = viewModel.layers[Math.max(0, index - 1)];
            updateLayerList();
            window.setTimeout(function () {
                viewModel.upLayer = viewModel.downLayer = null;
            }, 10);
        },
        lower: function (layer, index) {
            imageryLayers.lower(layer);
            viewModel.upLayer = viewModel.layers[Math.min(viewModel.layers.length - 1, index + 1)];
            viewModel.downLayer = layer;
            updateLayerList();
            window.setTimeout(function () {
                viewModel.upLayer = viewModel.downLayer = null;
            }, 10);
        },
        canRaise: function (layerIndex) {
            return layerIndex > 0;
        },
        canLower: function (layerIndex) {
            return layerIndex >= 0 && layerIndex < imageryLayers.length - 1;
        },
    };
    var baseLayers = viewModel.baseLayers;

    Cesium.knockout.track(viewModel);

    function addBaseLayerOption(name, imageryProvider) {
        var layer;
        if (typeof imageryProvider === 'undefined') {
            layer = imageryLayers.get(0);
            viewModel.selectedLayer = layer;
        } else {
            layer = new Cesium.ImageryLayer(imageryProvider);
        }
        layer.name = name;
        baseLayers.push(layer);
    }

    function addAdditionalLayerOption(name, imageryProvider, alpha, show) {
        var layer = imageryLayers.addImageryProvider(imageryProvider);
        layer.alpha = Cesium.defaultValue(alpha, 0.5);
        layer.show = Cesium.defaultValue(show, true);
        layer.name = name;
        Cesium.knockout.track(layer, ['alpha', 'show', 'name']);
    }

    function updateLayerList() {
        var numLayers = imageryLayers.length;
        viewModel.layers.splice(0, viewModel.layers.length);
        for (var i = numLayers - 1; i >= 0; --i) {
            viewModel.layers.push(imageryLayers.get(i));
        }
    }

    layer_check = viewModel;

    /**
     * レイヤー設定
     */
    function setupLayers() {
        addBaseLayerOption(
            // the current base layer
            'MOLA THEMIS blend',
            undefined
        );
        addBaseLayerOption(
            'MOLA_color',
            new Cesium.WebMapServiceImageryProvider({
                url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map',
                layers: 'MOLA_color',
                proxy: new Cesium.DefaultProxy('/proxy'),
                parameters: {
                    format: 'image/png',
                },
            })
        );
        addBaseLayerOption(
            'MDIM21 color',
            new Cesium.WebMapServiceImageryProvider({
                url: 'http://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map',
                layers: 'MDIM21_color',
                proxy: new Cesium.DefaultProxy('/proxy'),
                parameters: {
                    format: 'image/png',
                },
            })
        );
        addBaseLayerOption(
            'VIKING',
            new Cesium.WebMapServiceImageryProvider({
                url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/deimos_simp_cyl.map',
                layers: 'VIKING',
                proxy: new Cesium.DefaultProxy('/proxy'),
                parameters: {
                    format: 'image/png',
                },
            })
        );
        addBaseLayerOption(
            'THEMIS_night',
            new Cesium.WebMapServiceImageryProvider({
                url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map',
                layers: 'THEMIS_night',
                proxy: new Cesium.DefaultProxy('/proxy'),
                parameters: {
                    format: 'image/png',
                },
            })
        );
        addBaseLayerOption(
            'THEMIS',
            new Cesium.WebMapServiceImageryProvider({
                url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map',
                layers: 'THEMIS',
                proxy: new Cesium.DefaultProxy('/proxy'),
                parameters: {
                    format: 'image/png',
                },
            })
        );
        addBaseLayerOption(
            'MDIM21',
            new Cesium.WebMapServiceImageryProvider({
                url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map',
                layers: 'MDIM21',
                proxy: new Cesium.DefaultProxy('/proxy'),
                parameters: {
                    format: 'image/png',
                },
            })
        );
        addBaseLayerOption(
            'Viking mdim2.1',
            new Cesium.UrlTemplateImageryProvider({
                //url : "http://192.168.1.14/test/wmts/viking_mdim2.1/{z}/{x}/{reverseY}.png",
                //url : "http://192.168.1.14:9000/wmts/viking_mdim2.1/{z}/{x}/{reverseY}.png",
                url: basemap_viking_mdim,
                //tilingScheme : new Cesium.GeographicTilingScheme(),
                maximumLevel: 7,
            })
        );
        addBaseLayerOption(
            'MGS MOLA',
            new Cesium.UrlTemplateImageryProvider({
                //url : "http://192.168.1.14/test/wmts/viking_mdim2.1/{z}/{x}/{reverseY}.png",
                //url : "http://192.168.1.14:9000/wmts/MGS_MOLA/{z}/{x}/{reverseY}.png",
                url: basemap_MGS_MOLA,
                //tilingScheme : new Cesium.GeographicTilingScheme(),
                maximumLevel: 6,
            })
        );

        // addBaseLayerOption(
        //     'TEST_WMTS',
        //     new Cesium.WebMapTileServiceImageryProvider({
        //         //url: "https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map",
        //         //'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/AMSR2_Snow_Water_Equivalent/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png'
        //         url:"http://192.168.1.14:9000/wmts/viking_mdim2.1/{TileMatrix}/{TileRow}/{TileCol}.png",
        //         //layers: 'viking_mdim2.1',

        //         proxy: new Cesium.DefaultProxy('/proxy'),
        //         parameters: {
        //             format: 'image/png',
        //         }
        //     }));
        // addBaseLayerOption(
        //     'USGSShadedReliefOnly',
        //     new Cesium.WebMapTileServiceImageryProvider({
        //     url : 'http://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/WMTS/tile/1.0.0/USGSShadedReliefOnly/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
        //     layer : 'USGSShadedReliefOnly',
        //     style : 'default',
        //     format : 'image/jpeg',
        //     tileMatrixSetID : 'default028mm',
        //     maximumLevel: 19,
        //     credit : new Cesium.Credit({ text : 'U. S. Geological Survey' })
        // }));
        // addBaseLayerOption(
        //     'GENERIC',
        //     new Cesium.WebMapServiceImageryProvider({
        //         url: "https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/generic/generic_simp_cyl.map",
        //         layers: 'GENERIC',
        //         proxy: new Cesium.DefaultProxy('/proxy'),
        //         parameters: {
        //             format: 'image/png',
        //         }
        //     }));

        //    addBaseLayerOption(
        // 'GENERIC',
        // new Cesium.WebMapServiceImageryProvider({
        //     url: "https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/generic/generic_simp_cyl.map",
        //     layers: 'GENERIC',
        //     proxy: new Cesium.DefaultProxy('/proxy'),
        //     parameters: {
        //         format: 'image/png',
        //     }
        // }));
        // addAdditionalLayerOption(
        //     'line',
        //     new Cesium.WebMapServiceImageryProvider({
        //         url: "http://localhost8080/?map=/usr/share/mapserver/examples/critesline.map",
        //         layers: 'line',
        //         enablePickFeatures: false,
        //         proxy: new Cesium.DefaultProxy('/proxy'),
        //         parameters: {
        //             format: 'png',
        //             transparent: 'true',
        //         }
        //     }), 1.0, false);
        // addAdditionalLayerOption(
        //     'Saved_Point',//Red Ace postGIS at docker network
        //     // loadgeojson(record_json['geojson']),
        //     loadgeojson(geojson),
        //     0.6, false);

        addAdditionalLayerOption(
            'CRISM', //Red Ace postGIS at docker network
            new Cesium.WebMapServiceImageryProvider({
                url: `${Network_mapserver}/crism.map`,
                //url: "http://192.168.1.14/redace_map/?map=/maps/crism.map",
                layers: 'crism',
                proxy: new Cesium.DefaultProxy('/proxy'),
                parameters: {
                    format: 'image/png',
                    //transparent: 'true',
                },
            }),
            0.6,
            false
        );
        addAdditionalLayerOption(
            'THEMIS', //Red Ace postGIS at docker network
            new Cesium.WebMapServiceImageryProvider({
                url: `${Network_mapserver}/themis.map`,
                layers: 'themis',
                proxy: new Cesium.DefaultProxy('/proxy'),
                parameters: {
                    format: 'image/png',
                    //transparent: 'true',
                },
            }),
            0.6,
            false
        );

        testep = new Cesium.WebMercatorTilingScheme({
            //rectangleSouthwestInMeters:new Cesium.Cartesian2(0, 90),
        });

        //testep=new Cesium.WebMercatorProjection(Cesium.Ellipsoid.WGS84);

        // tresult={};
        // tresult.west=-315;
        // tresult.south = -86.7799;
        // tresult.east = 40.9568;
        // tresult.north = -38.2004;

        // pp=new PolarTilingSchema({
        //     rectangleSouthwestInMeters:new Cesium.Cartesian2(-86.7799,-310.957),
        //     rectangleNortheastInMeters:new Cesium.Cartesian2(-38.2004, 45)

        // });

        // console.log(testep);
        // console.log(pp);
        // Cesium.WebMercatorTilingScheme.prototype.rectangleToNativeRectangle=tresult;

        // testep.rectangle.east=-2.356194490192345;
        // testep.rectangle.north=-1.1330051337965372;
        // testep.rectangle.south=-1.1330051337965372;
        // testep.rectangle.west=-2.356194490192345;

        // console.log(testep);

        // addAdditionalLayerOption(
        // 'polar_test_mars',
        // new Cesium.WebMapServiceImageryProvider({
        //     url: "https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_spole.map&",
        //     layers: 'MOLA_color_south',
        //     proxy: new Cesium.DefaultProxy('/proxy'),
        //     parameters: {
        //         format: 'image/png',
        //         srs:"EPSG:32761",
        //     },
        //     tilingScheme: pp,

        // }), 1, false);

        // addAdditionalLayerOption(
        //     'polaer_test_moon',
        //     new Cesium.WebMapServiceImageryProvider({
        //         url: "http://chart.la-terre.co.jp:8080/?",
        //         layers: 'ENC',
        //         proxy: new Cesium.DefaultProxy('/proxy'),
        //         parameters: {
        //             format: 'image/png',
        //             //srs:Proj4js["IAU2000:49918"],
        //             //transparent: 'true',
        //             srs:"EPSG:32761",
        //         },
        //         // rectangle:new Cesium.Rectangle(
        //         //     Cesium.Math.toRadians(-159.963),
        //         //     Cesium.Math.toRadians(-76.4446),
        //         //     Cesium.Math.toRadians(-110.037),
        //         //     Cesium.Math.toRadians(-53.8634)
        //         // ),
        //         //tilingScheme: new Cesium.WebMercatorTilingScheme({
        //             tilingScheme: new Cesium.WebMercatorTilingScheme({
        //          //tilingScheme: new Cesium.GeographicTilingScheme({
        //         //rectangleSouthwestInMeters: new Cesium.Cartesian2(-90, -90),
        //         //rectangleNortheastInMeters: new Cesium.Cartesian2(90, 90),
        //                 //rectangle:new Cesium.Rectangle(-159.963, -76.4446,-110.037, -53.8634),
        //                // rectangle:new Cesium.Rectangle(-2.7918810313676894,-1.3342099653700572,-1.9205079490170005, -0.9400936763187137),
        //         // rectangle:new Cesium.Rectangle(
        //         //     Cesium.Math.toRadians(-159.963),
        //         //     Cesium.Math.toRadians(-76.4446),
        //         //     Cesium.Math.toRadians(-110.037),
        //         //     Cesium.Math.toRadians(-53.8634)
        //         // ),
        //         // projection :new Cesium.MapProjection({0,-90,0

        //         //    // project:new Cesium.Cartographic(longitude, latitude, height)

        //         //    } ),

        //         } ),
        //        // WebMercatorTilingScheme.prototype.rectangleToNativeRectangle(),
        //     }), 1, false);
        //console.log(Cesium.Rectangle.fromDegrees(-159.963, -76.4446,-110.037, -53.8634));

        // addAdditionalLayerOption(
        //     'test',//Red Ace postGIS at docker network
        //     new Cesium.WebMapServiceImageryProvider({
        //         url: "http://192.168.1.14:8080/?map=/maps/test.map",
        //         layers: 'test',
        //         proxy: new Cesium.DefaultProxy('/proxy'),
        //         parameters: {
        //             format: 'image/png',
        //             //srs:Proj4js["IAU2000:49918"],
        //             //transparent: 'true',

        //         },

        //     }), 0.6, false);

        addAdditionalLayerOption(
            'Mars500K_Quads',
            new Cesium.WebMapServiceImageryProvider({
                url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl_quads.map',
                layers: 'Mars500K_Quads',
                proxy: new Cesium.DefaultProxy('/proxy'),
                parameters: {
                    format: 'image/png',
                    transparent: 'true',
                },
            }),
            1.0,
            false
        );
        addAdditionalLayerOption(
            'Mars2M_Quads',
            new Cesium.WebMapServiceImageryProvider({
                url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl_quads.map',
                layers: 'Mars2M_Quads',
                proxy: new Cesium.DefaultProxy('/proxy'),
                parameters: {
                    format: 'image/png',
                    transparent: 'true',
                },
            }),
            1.0,
            false
        );
        addAdditionalLayerOption(
            'Mars5M_Quads',
            new Cesium.WebMapServiceImageryProvider({
                url: 'https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl_quads.map',
                layers: 'Mars5M_Quads',
                proxy: new Cesium.DefaultProxy('/proxy'),
                parameters: {
                    format: 'image/png',
                    transparent: 'true',
                },
            }),
            1.0,
            false
        );

        // addBaseLayerOption(
        //   'addLayer',
        //   new Cesium.WebMapServiceImageryProvider({
        //     //url :"http://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map",
        //     url:url,
        //     //layers:'MDIM21_color',
        //     layers:layer,
        //     parameters:{
        //       format : 'image/png',
        //     }
        //   }));
        // addAdditionalLayerOption(
        //     'test2',
        //     new Cesium.WebMapServiceImageryProvider({
        //         url: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/goes/conus_ir.cgi?',
        //         layers: 'goes_conus_ir',

        //         parameters: {
        //             transparent: 'true',
        //             format: 'image/png'
        //         }
        //     }), 1.0, false);
        addAdditionalLayerOption(
            'NOMENCLATURE',
            new Cesium.WebMapServiceImageryProvider({
                url: 'https://wms.wr.usgs.gov/cgi-bin/mapserv?map=/var/www/html/mapfiles/mars/mars_nomen_wms.map',
                layers: 'NOMENCLATURE',
                parameters: {
                    transparent: 'true',
                    format: 'image/png',
                },
            }),
            1.0,
            false
        );
    }

    setupLayers();
    updateLayerList();

    //Bind the viewModel to the DOM elements of the UI that call for it.
    var toolbar = document.getElementById('toolbar');
    Cesium.knockout.applyBindings(viewModel, toolbar);

    Cesium.knockout.getObservable(viewModel, 'selectedLayer').subscribe(function (baseLayer) {
        // Handle changes to the drop-down base layer selector.
        var activeLayerIndex = 0;
        var numLayers = viewModel.layers.length;
        for (var i = 0; i < numLayers; ++i) {
            if (viewModel.isSelectableLayer(viewModel.layers[i])) {
                activeLayerIndex = i;
                break;
            }
        }
        var activeLayer = viewModel.layers[activeLayerIndex];
        var show = activeLayer.show;
        var alpha = activeLayer.alpha;
        imageryLayers.remove(activeLayer, false);
        imageryLayers.add(baseLayer, numLayers - activeLayerIndex - 1);
        baseLayer.show = show;
        baseLayer.alpha = alpha;
        updateLayerList();
    });

    var entity = roots.map.entities.add({
        label: {
            show: false,
            showBackground: true,
            font: '14px monospace',
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(15, 0),
        },
    });
    var handler;
    var lon_event;
    var lat_event;

    handler = new Cesium.ScreenSpaceEventHandler(roots.map.scene.canvas);
    handler.setInputAction(function (movement) {
        var ellipsoid_c = roots.map.scene.globe.ellipsoid;
        var cartesian = roots.map.camera.pickEllipsoid(movement.endPosition, ellipsoid_c);
        cartesian_event = cartesian;
        if (cartesian) {
            var cartographic = ellipsoid_c.cartesianToCartographic(cartesian);
            var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(7);
            var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(7);
            lon_event = longitudeString;
            lat_event = latitudeString;
            entity.position = cartesian;
            entity.label.show = true;
            entity.label.text = `Lon: ${longitudeString.slice(-15)}\u00B0\nLat: ${latitudeString.slice(-15)}\u00B0`;
        } else {
            entity.label.show = false;
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    roots.map.canvas.addEventListener('pointerdown', onMouseDown);
    var downTime;
    function onMouseDown(event) {
        event.stopPropagation();
        event.preventDefault();
        downTime = new Date().getTime();
        roots.map.canvas.addEventListener('pointerup', onMouseUp);
    }
    function onMouseUp(event) {
        event.stopPropagation();
        event.preventDefault();
        var upTime = new Date().getTime();
        if (upTime - downTime < 200) {
            if (cartesian_event) {
                fetchDataClickedCoordinates(lon_event, lat_event);
            }
        }
        roots.map.canvas.removeEventListener('pointerup', onMouseUp);
    }
}

/**
 * マウス位置の取得
 */
function getMousePosition() {
    var entity = roots.map.entities.add({
        label: {
            show: false,
            showBackground: true,
            font: '14px monospace',
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(15, 0),
        },
    });
    var handler;
    var lon_event;
    var lat_event;

    handler = new Cesium.ScreenSpaceEventHandler(roots.map.scene.canvas);
    handler.setInputAction(function (movement) {
        var ellipsoid_c = roots.map.scene.globe.ellipsoid;
        var cartesian = roots.map.camera.pickEllipsoid(movement.endPosition, ellipsoid_c);
        cartesian_event = cartesian;

        if (cartesian) {
            var cartographic = ellipsoid_c.cartesianToCartographic(cartesian);
            var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(7);
            var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(7);
            lon_event = longitudeString;
            lat_event = latitudeString;
            entity.position = cartesian;
            entity.label.show = true;
            entity.label.text = `Lon: ${longitudeString.slice(-15)}\u00B0\nLat: ${latitudeString.slice(-15)}\u00B0`;
        } else {
            entity.label.show = false;
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

// function ORIGINAL_POSITION1() {
//     var screen = Cesium.Fullscreen.fullscreen;
//     flag_ref_position = true;
//     var e1 = document.getElementById('image_move');
//     var e2 = document.getElementById('image_move2');
//     var e3 = document.getElementById('graph_move');
//     e1.style.top = '300px';
//     e1.style.left = '-540px';
//     e2.style.top = '280px';
//     e2.style.left = '-540px';
//     e3.style.top = '100%';
//     e3.style.left = '0px';
// }

// function ORIGINAL_POSITION2() {
//     var e1 = document.getElementById('image_move');
//     var e2 = document.getElementById('graph_move');
//     e1.style.top = '50%';
//     e1.style.left = '10px';
//     e2.style.top = '10px';
//     e2.style.left = '30%';
// }

// function testtest() {
//     var itest;
//     for (itest = 0; itest < layer_check.layers.length; itest++) {
//         console.log(layer_check.layers[itest]);
//         console.log(layer_check.layers[itest]._imageryProvider._layers);
//         console.log(layer_check.layers[itest]._show);
//     }
// }
