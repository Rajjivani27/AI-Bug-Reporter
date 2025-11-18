console.log("Content script loaded successfully");

console.log("Sending message to background");
chrome.runtime.sendMessage({action : "inject_page_script"}, (resp) => {
    if(chrome.runtime.lastError){
        console.error("[CS] sendMessage error:", chrome.runtime.lastError);
    }
    else{
        console.log("[CS] inject_page_script response:", resp);
    }
});

console.log("Reached Here");

window.addEventListener("message", (event) => {
    console.log("I got this")
    if (event.source !== window){
        console.log("Yes i am here");
        return;
    };
    if (event.data.type === "AI_BUG_REPORTER_ERROR") {
        console.log("[AI Bug Reporter] Error captured:", event.data.data);
        chrome.runtime.sendMessage({ action: "reportBug", data: event.data.data });
    }
});
