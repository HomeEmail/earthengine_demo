
var poi = ee.Geometry.Point([113.89604185369978, 22.45862600104194]);

var ls8sr = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR");
var sarimage = ee.ImageCollection("COPERNICUS/S1_GRD");
//var sentinel2 = ee.ImageCollection("COPERNICUS/S2");

var sd1='2016-04-01';
var ed1='2017-05-30';

function generateMap(){

	sd1=ee.Date(sd1).format('YYYY-MM-dd');
	ed1=ee.Date(ed1).format('YYYY-MM-dd');
	print('sd',sd1,'ed',ed1);

	var images = ls8sr.filterBounds(poi).filter(ee.Filter.date(sd1,ed1));

	//var sent2 = sentinel2.filterBounds(poi).filter(ee.Filter.date(sd1,ed1));
	                  
	var vh = sarimage.filterBounds(poi)
	                     .filter(ee.Filter.date(sd1,ed1))
	                     .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
	                     .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
	  // Filter to get images collected in interferometric wide swath mode.
	                     .filter(ee.Filter.eq('instrumentMode', 'IW'));
	  
	var vhAscending = vh.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));
	//var vhDescending = vh.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));

	// Create a composite from means at different polarizations and look angles.
	var sd = vhAscending.select('VH').reduce(ee.Reducer.variance(),4);
	//var vh_sd = vhAscending.select('VH').reduce(ee.Reducer.variance(),4);
	//var sd_lower = vh_sd.lte(15);
	//var sd_mask = vh_sd.updateMask(sd_lower);


	var vh_mean = vh.select('VH').reduce(ee.Reducer.mean(),4);
	var mean_higher = vh_mean.gte(-11);
	var mean_mask = vh_mean.updateMask(mean_higher);

	var dv = mean_higher.divide(sd);
	var dv_higher = dv.gte(0.2);
	var dv_mask = dv.updateMask(dv_higher.gte(0.2));
	///Map.addLayer(dv_mask,{min:0,max:3,palette:['29ff57']},'幅度离差');
	var layer_dv = ui.Map.Layer(dv_mask,{min:0,max:3,palette:['29ff57']},'幅度离差');
	Map.layers().set(0, layer_dv);


	var ndvi = images.map(function(f){
	       return f.addBands(f.normalizedDifference(['B5','B4']).rename('NDVI'));
	});
	var ndvi_mean = ndvi.select('NDVI').reduce(ee.Reducer.mean(),4);
	var ndvi_lower = ndvi_mean.lte(0.3);
	var ndvi_mask1 = ndvi_mean.updateMask(ndvi_lower);
	//Map.addLayer(ndvi_mask1,{min:0,max:3,plette:['#4517ff']},'lower0.3');
	var layer_ndvi = ui.Map.Layer(ndvi_mask1,{min:0,max:3,plette:['#4517ff']},'lower0.3');
	Map.layers().set(1, layer_ndvi);

	//var ndvi_higher = ndvi_mean.gte(0.3);
	//var ndvi_mask = ndvi_mean.updateMask(ndvi_higher);
	var dv_ndvi = dv_mask.updateMask(ndvi_mask1);
	//Map.addLayer(dv_ndvi,{min:0,max:30,palette:['#ff250f']},'幅度离差_ndvi');
	var layer_dv_ndvi = ui.Map.Layer(dv_ndvi,{min:0,max:30,palette:['#ff250f']},'幅度离差_ndvi');
	Map.layers().set(2, layer_dv_ndvi);

}


Map.centerObject(poi, 13);

generateMap();

var dateStartInput=ui.Textbox({
  placeholder:'dateStart',
  value:'2016-04-01',
  onChange:function(e){
    print('dateStartInput',e);
    sd1=e;
  },
  disabled:false,
  style:{
    width:'120px',
    margin:'4px'
  }
});
var dateEndInput=ui.Textbox({
  placeholder:'dateStart',
  value:'2017-05-30',
  onChange:function(e){
    print('dateEndInput',e);
    ed1=e;
  },
  disabled:false,
  style:{
    width:'120px',
    margin:'4px'
  }
});

var button1=ui.Button({
  label:'query',
  onClick:function(){
    print('button1 click');
    generateMap();
  },
  disabled:false,
  style:{
    width:'120px'
  }
});

var main_panel = ui.Panel({
  widgets: [dateStartInput,dateEndInput,button1],
  style: {
    width: "200px",
    padding: "4px"
  }
});
ui.root.insert(0, main_panel);
