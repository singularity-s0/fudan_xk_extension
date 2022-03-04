// Multi Browser Support
if (typeof browser === "undefined") {
    var browser = chrome;
}

// Define Global Variables
var autoRefresh = 0;
var autoRefreshTimer;
//var autoSubmitCaptcha = false;
var preferredCourse = null;
var removeConflictLessons = false;
var removeFullLessons = false;
var filterLessonsWithExam = null;
var courseListObserver;

var refreshButton;
var autoSubmitCaptchaButton;
var preferredCourseButton;
var windowVariables;

var searchLessons = new Array();
var selectedLessons = new Array();
function contains(lesson) {
    for (var key in window.selected) {
        if (key == lesson['id']) {
            return true;
        }
    }
    return false;
}
function deepClone(obj) {
    var objClone = Array.isArray(obj) ? [] : {};
    if (obj && typeof obj === "object") {
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (obj[key] && typeof obj[key] === "object") {
                    objClone[key] = deepClone(obj[key]);
                } else {
                    objClone[key] = obj[key];
                }
            }
        }
    }
    return objClone;
}
function isConflict(selectedLessons, lessonArrangeInfo) {
    for (var index in selectedLessons) {
        for (var key in selectedLessons[index].arrangeInfo) {
            if (selectedLessons[index].arrangeInfo[key].weekDay == lessonArrangeInfo.weekDay) {
                if (!((selectedLessons[index].arrangeInfo[key].startUnit > lessonArrangeInfo.endUnit) ||
                      (selectedLessons[index].arrangeInfo[key].endUnit < lessonArrangeInfo.startUnit)
                      )) {
                    return true;
                }
            }
        }
    }
    return false;
}
function refreshLessonCache() {
    windowVariables = retrieveWindowVariables(["lessonJSONs", "lessonId2Counts"]);
    searchLessons = new Array();
    selectedLessons = new Array();
    for (var ss in windowVariables.lessonJSONs) {
        if (contains(windowVariables.lessonJSONs[ss])) {
            selectedLessons.push(windowVariables.lessonJSONs[ss]);
        } else {
            searchLessons.push(windowVariables.lessonJSONs[ss]);
        }
    }
}
/*
/// Fill in the captcha text box
function setCaptchaResponse(response) {
    document.getElementsByName("captcha_response")[0].value = response;
    if (autoSubmitCaptcha) {
        document.getElementById("stdSubmitButton").click();
    }
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.method == "set-captcha") {
        setCaptchaResponse(request.data);
    }
});

// Get captcha in base64
function getCaptchaBase64() {
    var img = document.querySelector("[alt='看不清,更换一张']");
    var c = document.createElement('canvas');
    c.height = img.naturalHeight;
    c.width = img.naturalWidth;
    var ctx = c.getContext('2d');
    
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL();
}*/

/*function main() {
    browser.runtime.sendMessage({ method: "send-image", data: getCaptchaBase64() });
    autoRefresh = 0;
    updateAutoRefresh();
}*/

// Auto Refresh
function refreshLessons() {
    if (autoRefresh) {
        document.getElementById("electableLessonList_filter_submit").click();
    }
}
function updateAutoRefresh() {
    if (autoRefresh <= 0) {
        refreshButton.innerHTML = "定时刷新：关闭";
        window.clearInterval(autoRefreshTimer);
    }
    else {
        refreshButton.innerHTML = "定时刷新: " + autoRefresh + "ms";
        autoRefreshTimer = window.setInterval(refreshLessons, autoRefresh);
    }
}

// Auto Retry Captcha
function retryCaptcha(courseId) {
    document.getElementById("cboxClose").click();
    document.getElementById("lesson" + courseId).querySelector("[class='lessonListOperator']").click();
}

const courseListChanged = function(mutationsList, observer) {
    refreshLessonCache();
    if (removeFullLessons) {
        for (var index1 in searchLessons) {
            for (var index2 in windowVariables.lessonId2Counts) {
                if (index2 == searchLessons[index1]['id'] && windowVariables.lessonId2Counts[index2]['lc'] == windowVariables.lessonId2Counts[index2]['sc']) {
                    document.getElementById("lesson" + searchLessons[index1]['id']).style.visibility = "hidden";
                }
            }
        }
    }
    if (removeConflictLessons) {
        for (var index in searchLessons) {
            for (var key in searchLessons[index].arrangeInfo) {
                if (isConflict(selectedLessons, searchLessons[index].arrangeInfo[key])) {
                    document.getElementById("lesson" + searchLessons[index]['id']).style.visibility = "hidden";
                    break;
                }
            }
        }
    }
    if (filterLessonsWithExam != null) {
        for (var index in searchLessons) {
            if (searchLessons[index].examFormName != filterLessonsWithExam) {
                document.getElementById("lesson" + searchLessons[index]['id']).style.visibility = "hidden";
            }
        }
    }
    
    if (preferredCourse != null) {
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
                preferredCourseButton.innerHTML = "Auto Elect When Available: OFF";
            }
        });
    }
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
    windowVariables = retrieveWindowVariables(["lessonJSONs", "lessonId2Counts"]);
    
    const targetNode = document.getElementById('electableLessonList_data');
    if (courseListObserver == undefined) {
        courseListObserver = new MutationObserver(courseListChanged);
    }
    courseListObserver.observe(targetNode, { attributes: true, childList: true, subtree: true });
    
    var disableConfirmationDialogButton = document.createElement("button");
    disableConfirmationDialogButton.innerHTML = "自动确认提交（隐藏“是否提交”提示框）";
    disableConfirmationDialogButton.onclick = function () {
        // Disable xk.fudan.edu.cn confirmation dialog
        const script = document.createElement("script");
        script.textContent = `
          window.confirm = () => true;
        `;
        document.documentElement.appendChild(script);
        script.remove();
        disableConfirmationDialogButton.disabled = true;
    }
    $("#electDescription").append(disableConfirmationDialogButton);
    
    refreshButton = document.createElement("button");
    refreshButton.innerHTML = "定时刷新: 关闭";
    refreshButton.onclick = function () {
        autoRefresh = parseInt(window.prompt("输入时间间隔（毫秒）或者取消以关闭此功能"));
        if (isNaN(autoRefresh)) { autoRefresh = 0; }
        updateAutoRefresh();
    }
    $("#electDescription").append(refreshButton);

    
    /*var autoSubmitCaptchaButton = document.createElement("button");
    autoSubmitCaptchaButton.innerHTML = "Auto Submit Captcha: " + autoSubmitCaptcha;
    autoSubmitCaptchaButton.onclick = function () {
        autoSubmitCaptcha = !autoSubmitCaptcha;
        autoSubmitCaptchaButton.innerHTML = "Auto Submit Captcha: " + autoSubmitCaptcha;
    }
    $("#electDescription").append(autoSubmitCaptchaButton);*/
    
    preferredCourseButton = document.createElement("button");
    preferredCourseButton.innerHTML = "有空余人数时自动选择课程: 关闭";
    preferredCourseButton.onclick = function () {
        preferredCourse = window.prompt("输入课程序号");
        if (preferredCourse == null) {
            preferredCourseButton.innerHTML = "有空余人数时自动选择课程: 关闭";
        }
        else {
            preferredCourseButton.innerHTML = "有空余人数时自动选择课程: " + preferredCourse;
        }
    }
    $("#electDescription").append(preferredCourseButton);
    
    window.selected = deepClone(windowVariables.lessonId2Counts);
    var duplicateButton = document.createElement("button");
    duplicateButton.innerHTML = "隐藏时间冲突的课";
    duplicateButton.onclick = function () {
        removeConflictLessons = !removeConflictLessons;
        if (removeConflictLessons) {
            duplicateButton.innerHTML = "显示时间冲突的课";
        }
        else {
            duplicateButton.innerHTML = "隐藏时间冲突的课";
        }
        courseListChanged();
    }
    $("#electDescription").append(duplicateButton);
    
    var essayButton = document.createElement("button");
    essayButton.innerHTML = "按期末考试类型筛选课程";
    essayButton.onclick = function () {
        filterLessonsWithExam = window.prompt("只显示具有以下类型的考试的课程（e.g. 闭卷）：");
        if (filterLessonsWithExam != null) {
            essayButton.innerHTML = "按期末考试类型筛选课程：" + filterLessonsWithExam;
        }
        else {
            essayButton.innerHTML = "按期末考试类型筛选课程";
        }
        courseListChanged();
    }
    $("#electDescription").append(essayButton);
    
    var fullButton = document.createElement("button");
    fullButton.innerHTML = "隐藏人数已满的课";
    fullButton.onclick = function () {
        removeFullLessons = !removeFullLessons;
        if (removeFullLessons) {
            fullButton.innerHTML = "显示人数已满的课";
        }
        else {
            fullButton.innerHTML = "隐藏人数已满的课";
        }
        courseListChanged();
    }
    $("#electDescription").append(fullButton);
});
