// WebRTC DataChannel client

var Peeer = (function() {
	// https://code.google.com/p/natvpn/source/browse/trunk/stun_server_list
	var SERVERS = {
		iceServers:[{url:'stun:stun.l.google.com:19302'}]
	}

	return function(params) {
		var channelName = "channel"; // not sure if this needs to be different if you want to have multiple peer connections
		var dataChannel = null;
		var peerConnection = null;

		var createDataChannel = function() {
			dataChannel = peerConnection.createDataChannel(channelName, {
				reliable: false
			});
		}
		var configureDataChannel = function() {
			dataChannel.onopen = function() {
				console.log('data channel open');
			};
  			dataChannel.onclose = function() {
  				console.log('data channel close');
  			};
  			dataChannel.onmessage = function(event) {
				console.log('data channel message:', event.data);
				if(params.onMessage) {
					params.onMessage(event);
				}
			};
		}
		peerConnection = new webkitRTCPeerConnection(SERVERS,
		{
			optional: [
				{
					RtpDataChannels: true
				}
			]
		});
		peerConnection.onicecandidate = function(event) {
			if(params.onCandidate && event.candidate) {
				params.onCandidate(event.candidate);
			}
		}
		this.addCandidate = function(candidate) {
			peerConnection.addIceCandidate(candidate);
		}
		this.offer = function(description, onOffer) {
			peerConnection.ondatachannel = function(event) {
				dataChannel = event.channel;
				configureDataChannel();
			}
			peerConnection.setRemoteDescription(description);
			peerConnection.createAnswer(function(description) {
				peerConnection.setLocalDescription(description);
				onOffer(description);
			});
		}
		this.answer = function(answer) {
			peerConnection.setRemoteDescription(answer);
		}
		this.initialize = function(onDescription) {
			createDataChannel();
			configureDataChannel();
			peerConnection.createOffer(function(description) {
				peerConnection.setLocalDescription(description);
				onDescription(description);
			});		
		}
		this.stop = function() {
			dataChannel.close();
			peerConnection.close();
		};
		this.send = function(message) {
			dataChannel.send(message);
		}
	}
})();