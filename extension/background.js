const DJANGO_API_URL = "http://127.0.0.1:8000/bug_reporter/";

console.log("[BG] service worker loaded at", new Date().toISOString());

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[BG] onMessage received:", message, "sender:", sender);

    try { sendResponse && sendResponse({ ok: true, received: message.action }); } catch (e) {}

    if(message.action === "inject_page_script"){
        console.log("I am here");
        
        let tabId = sender && sender.tab && sender.tab.id;

        const doInject = (tid) => {
            if(!tid){
                console.warn("[BG] No tabId available for injection.");
                return;
            }
            chrome.scripting.executeScript({
                target: {tabId : tid},
                world: "MAIN",
                files: ["injected.js"]
            })
            .then(() => console.log("[BG] injected injected.js into tab", tid))
            .catch(() => console.error("[BG] injection failed:", err));
        };

        if(tabId){
            doInject(tabId);
        }
        else{
            chrome.tabs.query({active : true, lastFocuseWindow: True}, (tabs) => {
                if(chrome.runtime.lastError){
                    console.error("[BG] tabs.query.error", chrome.runtme.lastError);
                    return;
                }

                const t = tabs && tabs[0];
                if(t && t.id) doInject(t.id);
                else console.warn("[BG] fallback could not find a tab to inject into");
            });
        }

        return;
    }
    if(message.action === "reportBug"){
        console.log("[AI Bug Reporter] Capturing screenshot..");

        chrome.tabs.captureVisibleTab(null, {format: "png"}, (image) => {
            if(chrome.runtime.lastError){
                console.error("Screenshot capture failed:", chrome.runtime.lastError);
                return;
            }

            const bugReport = {
                ...message.data,
                screenshot: image,
            };

            console.log("[AI Bug Reporter] Sending bug to Django API...");

            fetch(DJANGO_API_URL, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(bugReport),
            })
            .then((res) => res.text().then(body => ({status: res.status,body})))
            .then((data) => console.log("[AI Bug Reporter] Bug Reported successfully:",data))
            .catch((err) => console.log("[AI Bug Reporter] Failed to report bug:",err));
        });

        return;
    }
    else{
        console.log("Something Went Wrong")
    }
});