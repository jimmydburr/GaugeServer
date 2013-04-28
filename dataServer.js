var app = require('http').createServer(handler),
	fs = require('fs'),
	os = require('os'),
	sleep = require('sleep'),
	io = require('socket.io').listen(app);

var updateInterval = 1000;	// in milliseconds
var memToGB = 1024 * 1024 * 1024;	// convert bytes to gigs
var cpus = [];
var myData = {};
var setup_obj = {};
var usage = {};

setup_obj.hostname = os.hostname();
setup_obj.platform = os.platform();
setup_obj.type = os.type();
setup_obj.release = os.release();
setup_obj.uptime = os.uptime();
setup_obj.totalmem = os.totalmem();
setup_obj.freemem = os.freemem();
setup_obj.networkInterfaces = os.networkInterfaces();
setup_obj.cpus = os.cpus();
setup_obj.loadavg = os.loadavg();
//throw '';

app.listen(8080);

function convertMS(ms) {
  var d, h, m, s;
  s = Math.floor(ms / 1000);
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;
  return { d: d, h: h, m: m, s: s };
}
console.log(convertMS(setup_obj.uptime * 1000));
throw '';
function handler (req, res) {
	// upon first connect send the client code
	fs.readFile(__dirname + '/jsgdyn.html', function (err, data) {
		if (err) {
			console.log (err);
			res.writeHead(500);
			return res.end('Error loading jsgdyn.html');
		}
	res.writeHead(200);
	res.end(data);
	});
}
// create a websocket
io.sockets.on('connection', function(socket) {
	var earliestIdle = [];
	var latestIdle = [];

	socket.emit('setup_msg', setup_obj);
	// prime the pump by getting the first busy, idle data in the cpus array
	for (var i = 0, l = setup_obj.cpus.length; i < l; i ++) {
		earliestIdle[i] = os.cpus()[i].times.idle;
		sleep.usleep(updateInterval * 100);
		latestIdle[i] = os.cpus()[i].times.idle;
		idle = Math.round((latestIdle[i] - earliestIdle[i]) / updateInterval * 100);
		busy = 100 - idle;
		//console.log(busy,idle);
		cpus[i] = {usage: {busy: busy, idle: idle}};
	}
	myData.cpus = cpus;
	// ok kick things off in the browser
	socket.emit('broadcast_msg', myData);

	setInterval(function() {	// now collect and calc busy, idle data every updateInterval
		for (var i = 0, l = setup_obj.cpus.length; i < l; i ++) {
			earliestIdle[i] = latestIdle[i];
			latestIdle[i] = os.cpus()[i].times.idle;
			idle = Math.round((latestIdle[i] - earliestIdle[i]) / updateInterval * 100);
			busy = 100 - idle;
			cpus[i] = {usage: {busy: busy, idle: idle}};
		}
		myData.cpus = cpus;
		io.sockets.volatile.emit('broadcast_msg', myData);
	}, updateInterval);
});

