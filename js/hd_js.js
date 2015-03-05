var n;
var nPrime = 100;
var latmin;
var latmax;
var lngmin;
var lngmax;
var locations = [];
var width = $('#container').width();
var height = $('#container').height();
var numX;
var numY;
var count = 0;
var hr = 0;
var sliderShift = 500;
var civ = [];
var days = [];



var alpha = .7;
var play;
var times = []; 
var map;


function initializeMap() {
	
	var mapProp = {
		center: new google.maps.LatLng(37.23, -80.4178),
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		zoom: 8
	};
	
	map = new google.maps.Map(document.getElementById('googleMap'), mapProp);	
};

function setBounds() {
	latmin = map.getBounds().getSouthWest().lat();
	latmax = map.getBounds().getNorthEast().lat();
	lngmin = map.getBounds().getSouthWest().lng();
	lngmax = map.getBounds().getNorthEast().lng();

	$('#setBounds').hide();
	$('#instText').html('Loading data from WeatherUnderground...');
	$('#instructions').append(
	'<canvas id = "loadBar" width = "300" height="12"></canvas>'
	);
	buildList();
};

function buildList() {
	
	if (width >= height) {
		numY = Math.round(Math.sqrt(nPrime * height / width));
		numX = Math.floor(nPrime / numY);
	}
	else {
		numX = Math.round(Math.sqrt(nPrime * width / height));
		numY = Math.floor(nPrime / numX);
	};
	console.log('numX: ' + numX + ' numY: ' + numY + ' width:' + width + ' height:' + height);
	
	n = numX * numY;
	console.log('n = ' + n);
		
	for (i = 0; i < n; i++) {
		var x = Math.round(((i % numX) + 0.5) * width / numX);
		var y = Math.round((Math.floor(i / numX) + 0.5) * height / numY);
		var pos = i;
		var lng = x / width * (lngmax - lngmin) + lngmin;
		var lat = (height - y) / height * (latmax - latmin) + latmin;
		var location = {pos:pos, x:x, y:y, lng:lng, lat:lat};
		locations.push(location);
	};
	console.log('numX: ' + numX + 'numY: ' + numY);
	console.log(locations);
	getData();
};

function getData() {
	
	for (i = 0; i < n; i++) {
		runAjax (i);
	};
	console.log('done');
	
};

function runAjax(i) {
	var loc = locations[i].lat + ',' + locations[i].lng;
	$.ajax({
		url : "http://api.wunderground.com/api/6a583f8b2e0844be/hourly10day/q/" + loc + ".json",
		dataType : "jsonp",
		success : function(data) {
			
			if (data.hourly_forecast) {
				if (i == Math.round(nPrime / 2)) {
					$.each(data.hourly_forecast, function (h, val) {
						var elciv = val.FCTTIME.civil;
						var elday = val.FCTTIME.weekday_name;
						civ.push(elciv);
						days.push(elday);
					});
				}
			}
			
			var pop = [];
			var temp = [];
			var wspd = [];
			var wdir = [];
			var hum = [];
			
			 
			if (data.hourly_forecast) {
				$.each(data.hourly_forecast, function (h, val) {
					pop.push(val.pop);
					temp.push(val.temp.english);
					wspd.push(val.wspd.english);
					wdir.push(val.wdir.degrees);
					hum.push(val.humidity);
				});
				
				locations[i].pop = pop;
				locations[i].temp = temp;
				locations[i].wspd = wspd;
				locations[i].hum = hum;
				locations[i].wdir = wdir;
			}
			
			count++;
			
			var canvas = document.getElementById('loadBar');
			var ctx = canvas.getContext('2d');
			var prog = count / n * 300
			
			ctx.fillStyle = '#768d87';
			ctx.fillRect(0, 0, prog, 12);
			
			console.log(count);
			console.log(locations[i]);
			
			if (count == n) {
				buildSlider();
			}
		},
		error: function () {
			count++;
			console.log('Yaargh matey');
		}
	});
}	

function buildSlider () {
	$('#container').prepend(
		'<canvas id = "display" width = "'+ width + '" height="' + height + '"></canvas>'
	);
	$('#instructions').width(width-45);
	$('#instText').hide();
	$('#loadBar').hide();
	$('#reset').show();
	$('#pause').show();
	
	$('#instructions').append(
		'<select name = "displayType" class = "selectMenu" id = "displayType"><option value = "pop" selected>Chance of Precipitation</option><option value = "temp">Temperature</option><option value = "wspd">Wind Speed (mph)</option><option value = "hum">Relative Humidity</option></select>'			
	);
	$('#displayType').selectmenu({
		change: function (event, ui) {
			draw();
		}
	});

	var slideWidth = width - 450;
	$('#instructions').append('<div id="slider" style = "width: '+ slideWidth + 'px"></div>');
	$( "#slider" ).slider({
		value: hr,
		step: 1,
		min: 0,
		max: civ.length - 1,
		slide: function ( event, ui ) {
			hr = ui.value;
			$('#dayTime').html(days[hr] + ': ' + civ[hr]);
			draw();
		}
	});
	$('#dayTime').html(days[hr] + ': ' + civ[hr]);
	
	document.addEventListener('mousewheel', function(e){
	var dHr = e.wheelDelta / -120;
	hr = (hr + dHr > 0) ? (hr + dHr < civ.length - 1) ? hr + dHr : civ.length - 1 : 0;
	$( "#slider" ).slider({
		value: hr,
	});
	$('#dayTime').html(days[hr] + ': ' + civ[hr]);
	draw();
	}, false);

	run();
};



function draw() {
	
	var type = $('#displayType').val();
	console.log(type);
	if (type == 'temp') {
		tempSquares();
	}
	else if (type == 'hum') {
		humSquares();
	}
	else if (type == 'wspd') {
		windArrows();
	}
	else {
		rainCircles();
	};
};

function stop() {
	clearInterval(play);
	$('#pause').hide();
	$('#play').show();
};

function run() {
	$('#play').hide();
	$('#pause').show();
	play = setInterval(function() {timer()}, 300);
};
		
function timer() {	
	if (hr < civ.length - 1) {
		hr++;
	}
	else{
		hr = 0;
	};
	$( "#slider" ).slider({
		value: hr,
	});
	$('#dayTime').html(days[hr] + ': ' + civ[hr]);
	draw();	
};

function rainCircles () {
	var canvas = document.getElementById('display');
	var ctx = canvas.getContext('2d');
	console.log(hr);
	ctx.clearRect(0, 0, width, height);
	
$.each(locations, function(i, val) {
		if (val.pop) {
			ctx.fillStyle = 'rgba(97,97,97,.7)';
			var rad = (width / numX / 1.6) * val.pop[hr] / 100;
			var end = 2 * Math.PI;
			ctx.beginPath();
			ctx.arc(val.x, val.y, rad, 0, end, true);
			ctx.fill();
			if (val.pop[hr] > 40) {
				var rainText = val.pop[hr] + ' %';
				ctx.fillStyle = 'white';
				ctx.textAlign = 'center';
				ctx.font = '20px Ariel';
				ctx.fillText(rainText, val.x, val.y + 5);
			}
		}
	});
	
};

function tempSquares () {
	var canvas = document.getElementById('display');
	var ctx = canvas.getContext('2d');
	console.log(hr);
	ctx.clearRect(0, 0, width, height);
	
$.each(locations, function(i, val) {
	if (val.temp) {
		var  tempZH;
		if (val.temp[hr] < 0) {
			tempZH = 0;
		}
		else if (val.temp[hr] > 100) {
			tempZH = 100;
		}
		else {
			tempZH = val.temp[hr];
		}
		var red = Math.floor(tempZH * 255 / 100);
		var blue = 255 - red;
		console.log('i:' + i + ' pos:' + val.pos + ' x: ' + val.x + ' y: ' + val.y + ' lat: ' + val.lat + ' lng: ' + val.lng + ' temp:' + val.temp[hr] + ' tempZH:' + tempZH + ' red:' + red + ' blue:' + blue);
		var w = width / numX - 15;
		var h = height / numY - 15;
		
		ctx.fillStyle = 'rgba(' + red + ',0,' + blue + ',.6)';
		ctx.fillRect(val.x - w / 2, val.y - h / 2, w, h);
		console.log(ctx.fillStyle)
		var tempText = val.temp[hr] + ' F';
		ctx.textAlign = 'center';
		ctx.fillStyle = 'white';
		ctx.font = '20px Ariel';
		ctx.fillText(tempText, val.x, val.y + 5);
	}
});
	
};

function humSquares () {
	var canvas = document.getElementById('display');
	var ctx = canvas.getContext('2d');
	console.log(hr);
	ctx.clearRect(0, 0, width, height);
	
$.each(locations, function(i, val) {
	if (val.hum) {
		var red = Math.floor(val.hum[hr] * 255 / 100);
		var green = 255 - red;
		
		console.log('i:' + i + ' pos:' + val.pos + ' x: ' + val.x + ' y: ' + val.y + ' lat: ' + val.lat + ' lng: ' + val.lng + ' hum:' + val.hum[hr] + ' red:' + red + ' green:' + green)
		
		var w = width / numX - 15;
		var h = height / numY - 15;
		
		ctx.fillStyle = 'rgba(' + red + ',' + green + ',0,.6)';
		ctx.fillRect(val.x - w / 2, val.y - h / 2, w, h);
		console.log(ctx.fillStyle)
		
		var humText = val.hum[hr] + '%';
		ctx.textAlign = 'center';
		ctx.fillStyle = 'white';
		ctx.font = '20px Ariel';
		ctx.fillText(humText, val.x, val.y + 5);
	}
});
};

function windArrows () {
	var canvas = document.getElementById('display');
	var ctx = canvas.getContext('2d');
	console.log(hr);
	ctx.clearRect(0, 0, width, height);
	
$.each(locations, function(i, val) {
	if (val.wspd) {
		var w = width / numX;
		var h = height / numY;
		var dir = parseInt(val.wdir[hr]);
		
		var rad = (w > h) ? h / 2 : w / 2;
		
		function xCoord (deg, w) {
			var triX = Math.floor(val.x - Math.cos(Math.PI * (90 - deg) / 180) * rad);
			return triX;
		};
		function yCoord (deg, h) {
			var triY = Math.floor(val.y + Math.sin(Math.PI * (90 - deg) / 180) * rad);
			return triY;
		};

		var tipX = xCoord (dir, w);
		var tipY = yCoord (dir, h);

		var rLegX = xCoord ((dir + 150), w);
		var rLegY = yCoord ((dir + 150), h);

		var lLegX = xCoord ((dir + 210), w);
		var lLegY = yCoord ((dir + 210), h);
		
		var alpha = (val.wspd[hr] < 15) ? val.wspd[hr] / 15 : 1;
		
		ctx.fillStyle = 'rgba(77,77,77,' + alpha + ')';

		ctx.beginPath();
		ctx.moveTo(tipX,tipY);
		ctx.lineTo(rLegX,rLegY);
		ctx.lineTo(lLegX,lLegY);
		ctx.fill();
		
		ctx.textAlign = 'center';
		ctx.fillStyle = 'white';
		ctx.font = '20px Ariel';
		ctx.fillText(val.wspd[hr], val.x, val.y + 5);
	}
});
};

$('#setBounds').on('click', function () {
setBounds();
});

$('#pause').on('click', function() {
	stop();
});

$('#play').on('click', function() {
	run();
});

$('#reset').on('click', function() {
	location.reload();
});

var d = new Date();
var daySet = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var initialDay = daySet[d.getDay()];
var initial24 = d.getHours();
var initialHr = initial24 % 12;
if (initialHr == 0) {
	initialHr = 12;
}
if (initial24 > 11) {
	var initialM = 'PM';
}
else {
	var initialM = 'AM';
}
var initialMin = d.getMinutes() > 9 ? d.getMinutes() : '0' + d.getMinutes();
$('#dayTime').html(initialDay + ': ' + initialHr + ':' + initialMin + ' ' + initialM);



initializeMap();




