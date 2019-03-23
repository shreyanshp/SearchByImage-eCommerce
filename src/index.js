//Load the model
const classifier = ml5.imageClassifier('MobileNet', function() {
  console.log('Model Loaded!');
});
// References to all the element we will need.
var video = document.querySelector("#camera-stream"),
  image = document.querySelector("#snap"),
  start_camera = document.querySelector("#start-camera"),
  controls = document.querySelector(".controls"),
  take_photo_btn = document.querySelector("#take-photo"),
  delete_photo_btn = document.querySelector("#delete-photo"),
  translate_photo = document.querySelector("#translate-photo"),
  error_message = document.querySelector("#error-message"),
  api_request = document.querySelector("#api-photo"),
  camera_change = document.querySelector("#change-camera"),
  category_result = document.querySelector("#detected-category"),
  productUrl_result = document.querySelector("#detected-producturl"),
  hidden_canvas,
  byteCharacters,
  context;

//call camera
changeCamera("environment");

// Mobile browsers cannot play video without user input,
// so here we're using a button to start it manually.
start_camera.addEventListener("click", function(e) {
  e.preventDefault();

  // Start video playback manually.
  video.play();
  showVideo();
});

take_photo_btn.addEventListener("click", function(e) {
  e.preventDefault();

  var snap = takeSnapshot();

  // Show image.
  image.setAttribute("src", snap);
  image.classList.add("visible");

  // Enable delete and save buttons
  delete_photo_btn.classList.remove("disabled");
  translate_photo.classList.remove("disabled");
  api_request.classList.remove("disabled");

  // Pause video playback of stream.
  video.pause();
});

delete_photo_btn.addEventListener("click", function(e) {
  e.preventDefault();

  // Hide image.
  image.setAttribute("src", "");
  image.classList.remove("visible");

  // Disable delete and save buttons
  delete_photo_btn.classList.add("disabled");
  translate_photo.classList.add("disabled");
  api_request.classList.add("disabled");

  // Resume playback of stream.
  video.play();
});

api_request.addEventListener("click", function(e) {
  api_request.classList.add("disabled");
  image.classList.remove("visible");
  image.style.width = '224px';
  image.style.height = '224px';
  var ecommerceUrl =
    "https://rakuten_webservice-rakuten-marketplace-product-search-v1.p.rapidapi.com/services/api/Product/Search/20170426?keyword=";
  var me = "14478f483amshce21a80cf4fc7f8p1e1f28jsn1a007f1c3c58";
  classifier.predict(image)
    .then(function(results, err) {
      image.classList.add("visible");
      image.style.width = '100%';
      image.style.height = '100%';
      console.log("Success! on first request");
      category_result.innerHTML =
        "Keyword detected - " + results[0].className;
      return sendRequest(
        ecommerceUrl + results[0].className,
        "GET",
        "",
        me
      );
    }) 
    .then(function(product) {
      console.log("Success! on second request");
      api_request.classList.remove("disabled");
      console.log(
        JSON.parse(product.responseText).Products[0].Product.reviewUrlPC
      );
      productUrl_result.innerHTML =
        "<a href='" +
        JSON.parse(product.responseText).Products[0].Product.productUrlPC +
        "'target='_blank'> <img src='" +
        JSON.parse(product.responseText).Products[0].Product.mediumImageUrl +
        "'></a>";
    })
    .catch(function(error) {
      console.log("Something went wrong", error);
      api_request.classList.remove("disabled");
      alert(JSON.stringify(error));
    });
});

translate_photo.addEventListener("click", function(e) {
  api_request.classList.add("disabled");
  image.classList.remove("visible");
  image.style.width = '224px';
  image.style.height = '224px';
  var translateUrl = "https://systran-systran-platform-for-language-processing-v1.p.rapidapi.com/translation/text/translate?source=en&target=ja&input=";
  var ecommerceUrl =
    "https://rakuten_webservice-rakuten-marketplace-product-search-v1.p.rapidapi.com/services/api/Product/Search/20170426?keyword=";
  var me = "14478f483amshce21a80cf4fc7f8p1e1f28jsn1a007f1c3c58";
  classifier.predict(image)
    .then(function(results, err) {
      image.classList.add("visible");
      image.style.width = '100%';
      image.style.height = '100%';
      console.log("Success! on first request");
      category_result.innerHTML =
        "Keyword detected - " + results[0].className;
      return sendRequest(
        translateUrl + results[0].className,
        "GET",
        "",
        me
      );
    })
    .then(function(translate){
      console.log("Success! on second request");
      category_result.innerHTML =
        "Keyword translated to - " + JSON.parse(translate.responseText).outputs[0].output;
      return sendRequest(
        ecommerceUrl + JSON.parse(translate.responseText).outputs[0].output,
        "GET",
        "",
        me
      );
    }) 
    .then(function(product) {
      console.log("Success! on third request");
      api_request.classList.remove("disabled");
      console.log(
        JSON.parse(product.responseText).Products[0].Product.reviewUrlPC
      );
      productUrl_result.innerHTML =
        "<a href='" +
        JSON.parse(product.responseText).Products[0].Product.productUrlPC +
        "'target='_blank'> <img src='" +
        JSON.parse(product.responseText).Products[0].Product.mediumImageUrl +
        "'></a>";
    })
    .catch(function(error) {
      console.log("Something went wrong", error);
      api_request.classList.remove("disabled");
      alert(JSON.stringify(error));
    });
});

camera_change.addEventListener("click", function(e) {
  // Hide image.
  image.setAttribute("src", "");
  image.classList.remove("visible");
  // Disable delete and save buttons
  delete_photo_btn.classList.add("disabled");
  translate_photo.classList.add("disabled");
  api_request.classList.add("disabled");
  //stop current camera
  video.srcObject.getVideoTracks()[0].stop();
  //change camera
  changeCamera(camera_change.title);
  //update camera_change title to implement a toggle like feature
  if (camera_change.title == "environment") {
    camera_change.title = "user";
  } else {
    camera_change.title = "environment";
  }
  //start new camera
  video.play();
  showVideo();
});

function showVideo() {
  // Display the video stream and the controls.
  hideUI();
  video.classList.add("visible");
  controls.classList.add("visible");
}

function takeSnapshot() {
  // Here we're using a trick that involves a hidden canvas element.

  hidden_canvas = document.querySelector("canvas");
  context = hidden_canvas.getContext("2d");

  var width = video.videoWidth,
    height = video.videoHeight;

  if (width && height) {
    // Setup a canvas with the same dimensions as the video.
    hidden_canvas.width = width;
    hidden_canvas.height = height;

    // Make a copy of the current frame in the video on the canvas.
    context.drawImage(video, 0, 0, width, height);
    var block = hidden_canvas.toDataURL("image/png").split(";");
    // Get the content type of the image
    var contentType = block[0].split(":")[1]; // In this case "image/gif"
    // get the real base64 content of the file
    var realData = block[1].split(",")[1]; // In this case "R0lGODlhPQBEAPeoAJosM...."

    // Convert it to a blob to upload
    byteCharacters = b64toBlob(realData, contentType);
    // Turn the canvas image into a dataURL that can be used as a src for our photo.
    return hidden_canvas.toDataURL("image/png");
  }
}

function displayErrorMessage(error_msg, error) {
  error = error || "";
  if (error) {
    console.log(error);
  }

  error_message.innerHTML = error_msg;

  hideUI();
  error_message.classList.add("visible");
}

function hideUI() {
  // Helper function for clearing the app UI.
  controls.classList.remove("visible");
  start_camera.classList.remove("visible");
  video.classList.remove("visible");
  error_message.classList.remove("visible");
}

function b64toBlob(b64Data, contentType, sliceSize) {
  contentType = contentType || "";
  sliceSize = sliceSize || 512;

  var byteCharacters = atob(b64Data);
  var byteArrays = [];

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);

    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  var blob = new Blob(byteArrays, { type: contentType });
  return blob;
}

var sendRequest = function(url, method, data, rakutenrapidapikey) {
  // Create the XHR request
  var request = new XMLHttpRequest();

  // Return it as a Promise
  return new Promise(function(resolve, reject) {
    // Setup our listener to process compeleted requests
    request.onreadystatechange = function() {
      // Only run if the request is complete
      if (request.readyState !== 4) return;

      // Process the response
      if (request.status >= 200 && request.status < 300) {
        // If successful
        resolve(request);
      } else {
        // If failed
        reject({
          status: request.status,
          statusText: request.statusText
        });
      }
    };

    // Setup our HTTP request
    request.open(method || "POST", url, true);

    request.setRequestHeader("X-RapidAPI-Key", rakutenrapidapikey);
    // Send the request
    request.send(data);
  });
};

function changeCamera(data) {
  navigator.getMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

  if (!navigator.getMedia) {
    var constraints = { video: { facingMode: data } };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function(mediaStream) {
        video.srcObject = mediaStream;
        video.onloadedmetadata = function(e) {
          video.play();
          video.onplay = function() {
            showVideo();
          };
        };
      })
      .catch(function(err) {
        displayErrorMessage(
          "There was an error with accessing the camera stream: " + err.name,
          err
        );
        console.log(err.name + ": " + err.message);
      }); // always check for errors at the end.
  } else {
    navigator.getMedia(
      {
        video: { facingMode: data }
      },
      // Success Callback
      function(stream) {
        // Create an object URL for the video stream and
        // set it as src of our HTML video element.
        video.srcObject = stream;

        // Play the video element to start the stream.
        video.play();
        video.onplay = function() {
          showVideo();
        };
      },
      // Error Callback
      function(err) {
        var helpurl = "https://support.google.com/chrome/answer/2693767";
        var str = "NotAllowedError";
        if (str.includes(err.name)) {
          displayErrorMessage(
            "<a href='" +
              helpurl +
              "'target='_blank'>Please give us permission to access your camera, you can check this help link for Chrome</a>",
            err
          );
        } else {
          displayErrorMessage(
            "There was an error with accessing the camera stream: " + err.name,
            err
          );
        }
      }
    );
  }
}
