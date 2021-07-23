// Multi Browser Support
if (typeof browser === "undefined") {
    var browser = chrome;
}

// Define Global Variables
var autoRefresh = 0;
var autoRefreshTimer;
var autoSubmitCaptcha = false;
var preferredCourse = null;
var courseListObserver;

var refreshButton;
var autoSubmitCaptchaButton;
var preferredCourseButton;

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
    autoRefresh = 0;
    updateAutoRefresh();
}

var img = document.querySelector("[alt='看不清,更换一张']");
img.addEventListener('load', main);

// Auto Refresh
function refreshLessons() {
    if (autoRefresh) {
        document.getElementById("electableLessonList_filter_submit").click();
    }
}
function updateAutoRefresh() {
    if (autoRefresh <= 0) {
        refreshButton.innerHTML = "Auto Refresh: OFF";
        window.clearInterval(autoRefreshTimer);
    }
    else {
        refreshButton.innerHTML = "Auto Refresh: " + autoRefresh + "ms";
        autoRefreshTimer = window.setInterval(refreshLessons, autoRefresh);
    }
}

// Auto Retry Captcha
function retryCaptcha() {
    document.getElementById("cboxClose").click();
    // TODO
}

// Auto Elect Course When Available
const courseListChanged = function(mutationsList, observer) {
    var windowVariables = retrieveWindowVariables(["lessonJSONs", "lessonId2Counts"]);
    // Get lesson ids of user selection
    var ids = windowVariables.lessonJSONs.filter(function(value) {
        return (value['no'] == preferredCourse) || (value['code'] == preferredCourse); // Get only elements, which have such a key
    }).map(function(value) {
        return value['id']; // Extract the values only
    });
    if (ids.length == 0) {
        window.alert("No matching classes found");
        return;
    }
    
    // Find the first non-full class and elect it
    ids.forEach(function callbackFn(element) {
        if (windowVariables.lessonId2Counts[element]['sc'] < windowVariables.lessonId2Counts[element]['lc']) {
            // Elect it
            document.getElementById("lesson" + element).querySelector("[class='lessonListOperator']").click();
            
            // Remove auto election
            preferredCourse = null;
            courseListObserver.disconnect();
            preferredCourseButton.innerHTML = "Auto Elect When Available: OFF";
        }
    });
};
function retrieveWindowVariables(variables) {
    var ret = {};

    var scriptContent = "";
    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        scriptContent += "if (typeof " + currVariable + " !== 'undefined') $('body').attr('tmp_" + currVariable + "', JSON.stringify(" + currVariable + "));\n"
    }

    var script = document.createElement('script');
    script.id = 'tmpScript';
    script.appendChild(document.createTextNode(scriptContent));
    (document.body || document.head || document.documentElement).appendChild(script);

    for (var i = 0; i < variables.length; i++) {
        var currVariable = variables[i];
        ret[currVariable] = $.parseJSON($("body").attr("tmp_" + currVariable));
        $("body").removeAttr("tmp_" + currVariable);
    }

     $("#tmpScript").remove();

    return ret;
}

// UI
$(document).ready(function () {
    'use strict';
    refreshButton = document.createElement("button");
    refreshButton.innerHTML = "Auto Refresh: OFF";
    refreshButton.onclick = function () {
        autoRefresh = parseInt(window.prompt("Enter interval in ms. Or cancel to disable auto refresh"));
        if (isNaN(autoRefresh)) { autoRefresh = 0; }
        updateAutoRefresh();
    }
    $("#electDescription").append(refreshButton);
    
    var autoSubmitCaptchaButton = document.createElement("button");
    autoSubmitCaptchaButton.innerHTML = "Auto Submit Captcha: " + autoSubmitCaptcha;
    autoSubmitCaptchaButton.onclick = function () {
        autoSubmitCaptcha = !autoSubmitCaptcha;
        autoSubmitCaptchaButton.innerHTML = "Auto Submit Captcha: " + autoSubmitCaptcha;
    }
    $("#electDescription").append(autoSubmitCaptchaButton);
    
    preferredCourseButton = document.createElement("button");
    preferredCourseButton.innerHTML = "Auto Elect When Available: OFF";
    preferredCourseButton.onclick = function () {
        preferredCourse = window.prompt("Enter course code")
        if (preferredCourse == null) {
            courseListObserver.disconnect();
            preferredCourseButton.innerHTML = "Auto Elect When Available: OFF";
        }
        else {
            const targetNode = document.getElementById('electableLessonList_data');
            if (courseListObserver == undefined) {
                courseListObserver = new MutationObserver(courseListChanged);
            }
            courseListObserver.observe(targetNode, { attributes: true, childList: true, subtree: true });
            preferredCourseButton.innerHTML = "Auto Elect When Available: " + preferredCourse;
        }
    }
    $("#electDescription").append(preferredCourseButton);
});
