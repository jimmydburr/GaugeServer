var app = require('http').createServer(handler),
	fs = require('fs'),
	os=require('os'),
	sleep = require('sleep'),
	io = require('socket.io').listen(app);

var updateInterval = 1000;	// in milliseconds
var memToGB = 1024 * 1024 * 1024;	// convert bytes to gigs
var cpus = new Array();
var myData = new Object;
var setup_obj = new Object;
var usage = new Object;

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

function handler (req, res) {
	// upon first connect send the client code
	fs.readFile(__dirname + '/jsgdyn.html', function (err, data){
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
	var earliestIdle = new Array();
	var latestIdle = new Array();

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

