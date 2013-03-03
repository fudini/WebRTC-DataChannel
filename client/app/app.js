var App = (function() {
	var SOCKET_ADDRESS = 'http://localhost:8080';
	// var SOCKET_ADDRESS = 'http://209.114.35.172:8080';
	var channel;
	var socket;
	var onMessage = function(message) {
		$('#channelIn')[0].value += event.data;
	}
	var initializeRTC = function() {
		channel = new Peeer({
			onMessage: onMessage,
			onCandidate: function(candidate) {
				socket.emit('rtcMessage', {
					type:'candidate',
					data: candidate
				});
			}
		});
		console.log(channel);
		console.log("RTC initialized");
	}
	var startRTC = function() {
		channel.initialize(function(offer) {
			console.log(offer);
			socket.emit('rtcMessage', {
				type:'offer',
				data: offer
			});
		});
	}
	var handleOffer = function(offer) {
		console.log('offer', offer);
		var description = new RTCSessionDescription(offer);
		initializeRTC();
		channel.offer(description, function(answer) {
			console.log(answer);
			socket.emit('rtcMessage', {
				type:'answer',
				data: answer
			});
		});
	}
	var handleAnswer = function(answer) {
		console.log('answer', answer);
		var answer = new RTCSessionDescription(answer);
		channel.answer(answer);
	}
	var handleCandidate = function(candidate) {
		console.log('candidate', candidate);
		var candidate = new RTCIceCandidate(candidate);
		channel.addCandidate(candidate);
	}
	var App = {
		initialize: function() {
			socket = io.connect(SOCKET_ADDRESS);
			socket.on('error', function() {
				$('#message').html("Error connecting to the handshake server");
			});
			socket.on('connect', function() {
				$('#message').html("Socket server connected");
				socket.emit('getKey');
			});
			socket.on('disconnect', function() {
				$('#message').html("Socket server disconnected");
			});
			socket.on('key', function(data) {
				$('#thiskey').html(data.key);
			});
			socket.on('msg', function(data) {
				$('#message').html(data.message);
			});
			socket.on('gotPeer', function(data) {
				$('#message').html("got peer:" + data.key);
				initializeRTC();
				startRTC();
			});
			
			socket.on('rtcMessage', function(message) {
				console.log(message.type);
				switch(message.type) {
					case "offer":
						handleOffer(message.data);
						break;
					case "answer":
						handleAnswer(message.data);
						break;
					case "candidate":
						handleCandidate(message.data);
						break;
				}
			});

			$('#buttonGetKey').click(function() {
				socket.emit('getKey');
			});
			$('#buttonSendKey').click(function() {
				var key = $('#key').val();
				socket.emit('setKey', {key: key});
			});
			$('#disconnect').click(function() {
				socket.disconnect();
			});
			$('#channelSend').click(function() {
				var message = $('#channelOut').val();
				$('#channelOut').val('');
				channel.send(message);
			});
		}
	}
	return App;
})();

$(function() {
	App.initialize();
});