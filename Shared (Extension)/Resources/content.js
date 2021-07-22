// Define Global Variables
var autoRefresh = 0;
var autoRefreshTimer;
var autoSubmitCaptcha = false;

/// Fill in the captcha text box
function setCaptchaResponse(response) {
    document.getElementsByName("captcha_response")[0].value = response;
    if (autoSubmitCaptcha) {
        document.getElementById("stdSubmitButton").click();
    }
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received request: ", request);
    if (request.method == "set-captcha") {
        setCaptchaResponse(request.data);
    }
});

// Disable xk.fudan.edu.cn confirmation dialog
const script = document.createElement("script");
script.textContent = `
  window.confirm = () => true;
`;
document.documentElement.appendChild(script);
script.remove();

/// Get captcha in base64
function getCaptchaBase64() {
    var img = document.querySelector("[alt='看不清,更换一张']");
    var c = document.createElement('canvas');
    c.height = img.naturalHeight;
    c.width = img.naturalWidth;
    var ctx = c.getContext('2d');
    
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL();
}

function main() {
    browser.runtime.sendMessage({ method: "send-image", data: getCaptchaBase64() });
}

var img = document.querySelector("[alt='看不清,更换一张']");
img.addEventListener('load', main);

// Auto Refresh
function refreshLessons() {
    if (autoRefresh) {
        document.getElementById("electableLessonList_filter_submit").click();
    }
}

// Auto Retry Captcha
function retryCaptcha() {
    document.getElementById("cboxClose").click();
    
}

// UI
$(document).ready(function () {
    'use strict';
    var refreshButton = document.createElement("button");
    refreshButton.innerHTML = "Auto Refresh: OFF";
    refreshButton.onclick = function () {
        autoRefresh = parseInt(window.prompt("Enter interval in ms. Or cancel to disable auto refresh"));
        if (isNaN(autoRefresh)) { autoRefresh = 0; }
        if (autoRefresh <= 0) {
            refreshButton.innerHTML = "Auto Refresh: OFF";
            window.clearInterval(autoRefreshTimer);
        }
        else {
            refreshButton.innerHTML = "Auto Refresh: " + autoRefresh + "ms";
            autoRefreshTimer = window.setInterval(refreshLessons, autoRefresh);
        }
    }
    $("#electDescription").append(refreshButton);
    
    var autoSubmitCaptchaButton = document.createElement("button");
    autoSubmitCaptchaButton.innerHTML = "Auto Submit Captcha: " + autoSubmitCaptcha;
    autoSubmitCaptchaButton.onclick = function () {
        autoSubmitCaptcha = !autoSubmitCaptcha;
        autoSubmitCaptchaButton.innerHTML = "Auto Submit Captcha: " + autoSubmitCaptcha;
    }
    $("#electDescription").append(autoSubmitCaptchaButton);
});
