/// Fill in the captcha text box
function setCaptchaResponse(response) {
    document.getElementsByName("captcha_response")[0].value = response;
    document.getElementById("stdSubmitButton").click();
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
img.addEventListener('load', main)
