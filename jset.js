var updateInterval = 1000,
j = 0,
sleep = require('sleep'),
os=require('os');

var cpus = new Array();
var usage = new Object();

setInterval(function() {
	for (var i = 0, l = os.cpus().length; i < l; i ++) {
		earliestIdle = os.cpus()[i].times.idle;
		console.log('earliestIdle: ' + earliestIdle);
		sleep.usleep(updateInterval);
		latestIdle = os.cpus()[i].times.idle;
		console.log('latestIdle: ' + latestIdle);
		usage.idle = Math.round((latestIdle - earliestIdle) / updateInterval * 100);
		console.log('current idle: ' + usage.idle);
		usage.busy = 100 - usage.idle;
		console.log('cpu =' + usage.idle + ' ' + usage.busy);
	cpus[j++] = usage;
	}
	console.log(cpus);
}, updateInterval);

