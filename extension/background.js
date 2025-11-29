const DJANGO_API_URL = "http://127.0.0.1:8000/bug_reporter/";

console.log("[BG] service worker loaded at", new Date().toISOString());

function safeFileName(str){
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g,"_")
        .replace(/^_+|_+$/g,"")
        .slice(0,50);
}

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
            .catch((err) => console.error("[BG] injection failed:", err));
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

        const targetWindowId = (sender && sender.tab && sender.tab.windowId) ? sender.tab.windowId : null;

        chrome.tabs.captureVisibleTab(targetWindowId, {format: "png"}, (image) => {
            if(chrome.runtime.lastError){
                console.error("Screenshot capture failed:", chrome.runtime.lastError);
                return;
            }

            const errorMessage = message.data?.error_message || "error";

            const safeName = safeFileName(errorMessage);
            console.log("SafeFileName: ",safeName);

            const ssFileName = `${safeName}.png`;

            const bugReport = {
                ...message.data,
            };

            function dataURLtoBlob(dataURL){
                const parts = dataURL.split(',');
                const mimeMatch = parts[0].match(/:(.*?);/);
                const mime = mimeMatch ? mimeMatch[1] : 'image/png';
                const byteString = atob(parts[1]);
                const len = byteString.length;
                const u8arr = new Uint8Array(len);
                for(let i = 0;i < len;i++){
                    u8arr[i] = byteString.charCodeAt(i);
                }

                return new Blob([u8arr],{type : mime});
            }

            const screenshotBlob = dataURLtoBlob(image);

            const formdata = new FormData();

            Object.entries(bugReport).forEach(([key,value]) => {
                if(value !== undefined && value !== null){
                    formdata.append(key,String(value));
                }
            });

            formdata.append("screenshot",screenshotBlob,ssFileName);

            console.log("[AI Bug Reporter] Sending bug to Django API...");

            fetch(DJANGO_API_URL, {
                method: "POST",
                body: formdata,
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