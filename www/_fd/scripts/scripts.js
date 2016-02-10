/** Start Google Chrome Canary with open -a Google\ Chrome\ Canary --args --enable-media-stream  OR enable the flag in about:flags **/

var App = {

	// Run if we do have camera support
	successCallback : function(stream) {
        console.log('yeah! camera support!');
        if (window.URL) {
			App.video.src = window.URL.createObjectURL(stream);
		} else {
			App.video.src = stream;
        }
    },

	// run if we dont have camera support
	errorCallback : function(error) {
		alert('An error occurred while trying to get camera access (Your browser probably doesnt support getUserMedia() ): ' + error.code);
		return;
	},


	drawToCanvas : function(video, canvas, ctx, effect) {
		var i;
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

			App.pixels = ctx.getImageData(0,0,canvas.width,canvas.height);

		// Hipstergram!
		
		if (effect === 'hipster') {

			for (i = 0; i < App.pixels.data.length; i=i+4) {
				App.pixels.data[i + 0] = App.pixels.data[i + 0] * 3 ;
				App.pixels.data[i + 1] = App.pixels.data[i + 1] * 2;
				App.pixels.data[i + 2] = App.pixels.data[i + 2] - 10;
			}

			ctx.putImageData(App.pixels,0,0);

		}

		// Blur!

		else if (effect === 'blur') {
			stackBlurCanvasRGBA(canvas.id,0,0,515,426,20);
		}

		// Green Screen

		else if (effect === 'greenscreen') {
				
					/* Selectors */
					var rmin = $('#red input.min').val();
					var gmin = $('#green input.min').val();
					var bmin = $('#blue input.min').val();
					var rmax = $('#red input.max').val();
					var gmax = $('#green input.max').val();
					var bmax = $('#blue input.max').val();

					// console.log(rmin,gmin,bmin,rmax,gmax,bmax);
					
					for (i = 0; i < App.pixels.data.length; i=i+4) {
									red = App.pixels.data[i + 0];
									green = App.pixels.data[i + 1];
									blue = App.pixels.data[i + 2];
									alpha = App.pixels.data[i + 3];

									if (red >= rmin && green >= gmin && blue >= bmin && red <= rmax && green <= gmax && blue <= bmax ) {
										App.pixels.data[i + 3] = 0;
									}
					}

					ctx.putImageData(App.pixels,0,0);

		}
		else if(effect === 'glasses') {
			var comp = ccv.detect_objects({ "canvas" : (canvas),
											"cascade" : cascade,
											"interval" : 1,
											"min_neighbors" : 1 });

			// Draw glasses on everyone!
			for (i = 0; i < comp.length; i++) {
				ctx.drawImage(App.glasses, comp[i].x, comp[i].y,comp[i].width, comp[i].height);
			}
						
		}
	
					
	},

	startLocalEffect : function(effect) {
		if (App.remoteConn) {
			App.remoteConn.send(effect);
		}
		if(App.playingLocal) { clearInterval(App.playingLocal); }
		App.playingLocal = setInterval(function() {
			App.drawToCanvas(App.video, App.canvasMe, App.ctxMe, effect);
		},50);
	},
	startRemoteEffect : function(effect) {
		if(App.playingRemote) { clearInterval(App.playingRemote); }
		App.playingRemote = setInterval(function() {
			App.drawToCanvas(App.remoteVideo, App.canvas, App.ctx, effect);
		},50);
	}
};

App.init = function() {
	// Prep the document
	App.video = document.querySelector('video#myvideo');
	App.remoteVideo = document.querySelector('video#remotevideo');
	App.glasses = new Image();
	App.glasses.src = "fdlib/i/glasses.png";

	App.canvas = document.querySelector("#output");
	App.canvasMe = document.querySelector("#outputMe");
	App.ctx = App.canvas.getContext("2d");
	App.ctxMe = App.canvasMe.getContext("2d");

	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

	// Finally Check if we can run this puppy and go!
	App.remoteStreamCallback = function(call) {
		call.on('stream', function(remoteStream) {
			if (window.URL) {
				App.remoteVideo.src = window.URL.createObjectURL(remoteStream);
			} else {
				App.remoteVideo.src = stream;
			}
		});
	};

	App.connCallback = function(conn) {
		App.remoteConn = conn;
		conn.on('open', function() {
			conn.on('data', function(data) {
				App.startRemoteEffect(data);
			});
		});

		conn.send('Hello!');
	};

	if (navigator.getUserMedia) {
		if (!isHost) {
			var conn = peer.connect(room);
			App.connCallback(conn);
			navigator.getUserMedia({video: true, audio: true}, function(stream) {
				var call = peer.call(room, stream);
				App.remoteStreamCallback(call);
				if (window.URL) {
					App.video.src = window.URL.createObjectURL(stream);
				} else {
					App.video.src = stream;
				}
			}, function(err) {
				console.log('Failed to get local stream' ,err);
			});
		} else {
			peer.on('connection', function(conn) {
				App.connCallback(conn);
			});
			peer.on('call', function(call) {
				App.remoteStreamCallback(call);

				navigator.getUserMedia({video: true, audio: true}, function(stream) {
					call.answer(stream); // Answer the call with an A/V stream.
					if (window.URL) {
						App.video.src = window.URL.createObjectURL(stream);
					} else {
						App.video.src = stream;
					}
				}, function(err) {
					console.log('Failed to get local stream' ,err);
				});
			});
		}
		//navigator.getUserMedia({video: true, audio: true}, App.successCallback, App.errorCallback);
	}

	App.startLocalEffect();
	App.startRemoteEffect();

};


document.addEventListener("DOMContentLoaded", function() {
	console.log('ready!');
}, false);
