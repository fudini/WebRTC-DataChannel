var io = require('socket.io').listen(8080);
io.set('log level', 1);
var pairs = {};
io.sockets.on('connection', function (socket) {
	console.log("connected:" + socket.id);
	socket.on('getKey', function(data) {
		socket.emit('key', {key: socket.id});
	});
	socket.on('setKey', function(data) {
		if(data.key in io.sockets.sockets) {
			var client = io.sockets.socket(data.key);
			pairs[socket.id] = client;
			pairs[client.id] = socket;
			socket.emit('msg', {message: "Session found:" + data.key});
			client.emit('gotPeer', {key: socket.id});
		} else {
			socket.emit('msg', {message: "There's no session with this key:" + data.key});
		}
	});

	socket.on('rtcMessage', function(data) {
		var pair = pairs[socket.id];
		if(pair) {
			pair.emit('rtcMessage', data);
		}
	});

	socket.on('disconnect', function() {
		console.log("disconnected:" + socket.id);
		var pair = pairs[socket.id];
		if(pair) {
			delete pairs[pair.id];
			delete pairs[socket.id];
		}
	});
});