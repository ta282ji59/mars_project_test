/**
 * ネットワーク設定
 * URLを変数に代入して使いやすくしている。
 */

// var Network_ajax_db='/map3d/static/map3d/api_db-v01.py';
// var Network_ajax_db='/views_old/api_db.py'; //usui
var Network_ajax_db='/views/api_db.py'; ///usui
// var Network_ajax_directory=headname+'/cgi-bin/api_directory-v01.py'; ///usui
// var Network_ajax_directory='http://localhost:8000/redace/cgi-bin/api_directory-v01.py'; ///usui
var Network_ajax_directory='/views/api_dir.py'; //usui
// var Network_ajax_ref=headname+'/cgi-bin/api_reflectance-v01.py'; ///usui
// var Network_ajax_ref='http://localhost:8000/redace/cgi-bin/api_reflectance-v01.py'; ///usui
var Network_ajax_ref='/views/api_reflectance.py';
// var Network_mapserver='http://172.16.238.3:80/redace_map/?map=/maps';
// var Network_mapserver='http://localhost:8000/redace_map/?map=/maps';
var Network_mapserver='/redace_map/?map=/maps';
// var Network_terrainserver='http://192.168.1.14/redace_terrain/tilesets/mars';
// var Network_terrainserver='http://localhost:8000/redace_terrain/tilesets/mars';
var Network_terrainserver='/redace_terrain/tilesets/mars';




// base map  ( using reverse proxy : port 80)
var basemap_viking_mdim="http://192.168.1.14/wmts/viking_mdim2.1/{z}/{x}/{reverseY}.png";
var basemap_MGS_MOLA="http://192.168.1.14/wmts/MGS_MOLA/{z}/{x}/{reverseY}.png";


