// Multi Browser Support
if (typeof browser === "undefined") {
    var browser = chrome;
}

/// Send captcha in base64 to our flask OCR server
function sendImage(content) {
    $.ajax({
      type: "POST",
      url: 'http://localhost:5000/img2text',
      data: `{
        "image": "` + content.replace("data:image/png;base64,", "") + `"
}`,
      dataType: "text",
    complete: function (jqXHR, textStatus) {
        browser.tabs.query({}, function(tabs) {
            for (var i=0; i<tabs.length; ++i) {
                chrome.tabs.sendMessage(tabs[i].id, { method: "set-captcha", data: jqXHR.responseText });
            }
        });
    },
    });
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("request received");
    if (request.method == "send-image") {
        sendImage(request.data);
    }
});
