//our username 
var name; 
var connectedUser;
  
//connecting to our signaling server
var conn = new WebSocket('ws://192.168.1.120:9090');
  
conn.onopen = function () { 
   console.log("Connected to the signaling server"); 
};
  
//when we got a message from a signaling server 
conn.onmessage = function (msg) { 
   console.log("Got message", msg.data);
   var data = JSON.parse(msg.data); 
   switch(data.type) { 
      case "login": 
         handleLogin(data.success); 
         break; 
      //when somebody wants to call us 
      case "offer": 
         handleOffer(data.offer, data.name); 
         break; 
      case "answer": 
         handleAnswer(data.answer); 
         break; 
      //when a remote peer sends an ice candidate to us 
      case "candidate": 
         handleCandidate(data.candidate); 
         break; 
      case "leave": 
         handleLeave(); 
         break; 
      default: 
         break; 
   }
};
  
conn.onerror = function (err) { 
   console.log("Got error", err); 
};
  
//alias for sending JSON encoded messages 
function send(message) { 
   //attach the other peer username to our messages 
   if (connectedUser) { 
      message.name = connectedUser; 
   } 
   conn.send(JSON.stringify(message)); 
};
  
//****** 
//UI selectors block 
//******
 
var loginPage = document.querySelector('#loginPage'); 
var usernameInput = document.querySelector('#usernameInput'); 
var loginBtn = document.querySelector('#loginBtn'); 

var callPage = document.querySelector('#callPage'); 
var callToUsernameInput = document.querySelector('#callToUsernameInput');
var callBtn = document.querySelector('#callBtn'); 

var hangUpBtn = document.querySelector('#hangUpBtn');
  
var localVideo = document.querySelector('#localVideo'); 
var remoteVideo = document.querySelector('#remoteVideo'); 

var yourConn; 
var stream;
  
callPage.style.display = "none";

// Login when the user clicks the button 
loginBtn.addEventListener("click", function (event) { 
   name = usernameInput.value;
   if (name.length > 0) { 
      send({ 
         type: "login", 
         name: name 
      }); 
   }
});
  
function handleLogin(success) { 
   if (success === false) { 
      alert("Ooops...try a different username"); 
   } else { 
      loginPage.style.display = "none"; 
      callPage.style.display = "block";
      //********************** 
      //Starting a peer connection 
      //********************** 
      //getting local video stream 
         console.log("zhanglianjie-----------------------------1");
	//navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia; 
	navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia); 
      navigator.getUserMedia({ video: true, audio: true }, function (myStream) { 
         stream = myStream; 
         //displaying local video stream on the page 
         localVideo.src = window.URL.createObjectURL(stream);
         //using Google public stun server 
         var configuration = { 
            "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
         }; 
         console.log(stream); 
         console.log("zhanglianjie-----------------------------stream"); 
         yourConn = new RTCPeerConnection(configuration); 
         // setup stream listening 
         yourConn.addStream(stream); 
         //when a remote user adds stream to the peer connection, we display it 
         yourConn.onaddstream = function (e) { 
            remoteVideo.src = window.URL.createObjectURL(e.stream); 
         };
         // Setup ice handling 
         yourConn.onicecandidate = function (event) { 
            if (event.candidate) { 
               send({ 
                  type: "candidate", 
                  candidate: event.candidate 
               }); 
            } 
         };  
      }, function (error) { 
         console.log(error); 
      }); 
   } 
};
  
//initiating a call 
callBtn.addEventListener("click", function () {
         console.log("zhanglianjie-----------------------------2"); 
 
   var callToUsername = callToUsernameInput.value;
   if (callToUsername.length > 0) { 
      connectedUser = callToUsername;
      // create an offer 
      yourConn.createOffer(function (offer) { 
         send({ 
            type: "offer", 
            offer: offer 
         }); 
         yourConn.setLocalDescription(offer); 
      }, function (error) { 
         alert("Error when creating an offer"); 
      });
   } 
});
  
//when somebody sends us an offer 
function handleOffer(offer, name) { 
   connectedUser = name; 
   yourConn.setRemoteDescription(new RTCSessionDescription(offer));
   //create an answer to an offer 
   yourConn.createAnswer(function (answer) { 
      yourConn.setLocalDescription(answer); 
      send({ 
         type: "answer", 
         answer: answer 
      }); 
   }, function (error) { 
      alert("Error when creating an answer"); 
   }); 
};
  
//when we got an answer from a remote user
function handleAnswer(answer) { 
   yourConn.setRemoteDescription(new RTCSessionDescription(answer)); 
};
  
//when we got an ice candidate from a remote user 
function handleCandidate(candidate) { 
   yourConn.addIceCandidate(new RTCIceCandidate(candidate)); 	
     console.log("zhanglianjie-----------------------------getstats"); 
	var selector = yourConn.getRemoteStreams()[0].getAudioTracks()[0];
	
	var rttMeasures = [];

// ... wait a bit
var aBit = 1000; // in milliseconds
setTimeout(function () {
  yourConn.getStats(selector, function (report) {
    for (var i in report) {
      // the below parsing may not work correctly in any browser
      // as they have differing implementations.
      var now = report[i];
        console.log ("report: ");
        console.log (now);
      if (now.type == "outboundrtp") {
        // this is an example based on mid-2015,
        // the object returned by stats API
    		// use googRTT for chrome/opera or mozRTT for firefox.
        // the objects are expected to change, the standard is documented at:
        // http://www.w3.org/TR/webrtc-stats/
        //rttMeasures.append(now.roundTripTime);
    		var avgRTT = average(now.roundTripTime);
        // this is a very simple emodel and does not take
        // packetization time, or inter-frame delay metrics into account.
        // You may calculate the e-value at each sample
        // or at the end of the call.
        var emodel = 0;
        if (avgRtt/2 >= 500)
           emodel = 1;
        else if (avgRtt/2 >= 400)
           emodel = 2;
        else if (avgRtt/2 >= 300)
           emodel = 3;
        else if (avgRtt/2 >= 200)
           emodel = 4;
        else if (avgRtt/2 < 200)
           emodel = 5;
        console.log ("e-model: "+str(emodel));
      }
    }
  }, logError);
}, aBit);



};
   
//hang up 
hangUpBtn.addEventListener("click", function () { 

//--------------
//---------------
   send({ 
      type: "leave" 
   });  
   handleLeave(); 
});
  
function handleLeave() { 
   connectedUser = null; 
   remoteVideo.src = null; 
   yourConn.close(); 
   yourConn.onicecandidate = null; 
   yourConn.onaddstream = null; 
};




function average (values) {
  var sumValues = values.reduce(function(sum, value){
    return sum + value;
  }, 0);
 	return (sumValues / values.length);
}

function logError(error) {
  log(error.name + ": " + error.message);
}
