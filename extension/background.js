const DJANGO_API_URL = "http://127.0.0.1:8000/bug_reporter/";

const ext = (typeof browser !== "undefined") ? browser : chrome;

console.log("[BG2] service worker loaded at:", new Date().toISOString());

function safeFileName(str = ""){
    return String(str)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0,50) || "error";
}

function dataURLToBlob(dataURL){
    const parts = dataURL.split(",");
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const byteString = atob(parts[1] || "");
    const len = byteString.length;
    const u8arr = new Uint8Array(len);
    for(let i=0;i<len;i++) u8arr[i] = byteString.charCodeAt(i);
    return new Blob([u8arr] , {type : mime});
}

function queryTabs(queryObj){
    if(ext.tabs && ext.tabs.query){
        try{
            const maybePromise = ext.tabs.query(queryObj);
            if(maybePromise && typeof maybePromise.then == "function"){
                return maybePromise;
            }
        }
        catch(e){
            console.warn("[BG] tabs.query promise-check threw:", e);
        }

        return new Promise((resolve,reject) => {
            ext.tabs.query(queryObj, (tabs) => {
                const err = ext.runtime?.lastError || chrome?.runtime?.lastError;
                if(err) reject(err);
                else resolve(tabs);
            });
        });
    }

    return Promise.reject(new Error("tabs.query not available"));
}

async function doInjectScript(tabId,files=["injected.js"]){
    if(ext.scripting && ext.scripting.executeScript){
        try{
            await ext.scripting.executeScript({
                target: {tabId},
                world: "MAIN",
                files
            });
            console.log("[BG] injected via scripting.executeScript into tab:", tabId);
            return;
        }
        catch(err){
            console.warn("[BG] scripting.executeScript failed, will try fallback:",err);
        }
    }

    if(ext.tabs && ext.tabs.executeScript){
        try{
            await new Promise((resolve,reject) => {
                ext.tabs.executeScript(tabId, {file : files[0]}, (res) => {
                    const err = ext.runtime?.lastError || chrome?.runtime?.lastError;
                    if(err) reject(err);
                    else{
                        console.log("[BG] injected via tabs.executeScript into tab", tabId);
                        resolve(res);
                    }
                });
            });
            return;
        }
        catch(err){
            console.error("[BG] tabs.executeScript fallback failed:", err);
            throw err;
        }
    }

    throw new Error("No injection API available in this browser");
}

async function captureVisibleTab(windowId, options={format : "png"}){
    if(ext.tabs && ext.tabs.captureVisibleTab){
        try{
            const maybePromise = ext.tabs.captureVisibleTab(windowId,options);
            if(maybePromise && typeof maybePromise.then === "function"){
                return await maybePromise;
            }
        }
        catch(e){
            console.warn("[BG] captureVisibleTab promise-style check failed:",e);
        }

        return await new Promise((resolve,reject) => {
            ext.tabs.captureVisibleTab(windowId,options, (dataUrl) => {
                const err = ext.runtime?.lastError || chrome?.runtime?.lastError;
                if(err) reject(err);
                else resolve(dataUrl);
            });
        });
    }

    throw new Error("captureVisibleTab is not available in this runtime");
}

chrome.runtime.onMessage.addListener((message,sender,sendResponse) => {
    try { sendResponse && sendResponse({ ok:true, received: message?.action}); } catch(e) {}

    (async () => {
        try{
            if(!message || !message.action){
                console.warn("[BG] received message with no action");
                return;
            }

            if(message.action === "inject_page_script"){
                console.log("[BG] inject_page_script request received");

                const tabId = sender?.tab?.id;

                if(tabId){
                    try{
                        await doInjectScript(tabId, ["injected.js"]);
                    }
                    catch(err){
                        console.error("[BG] Injection error for tab", tabId,err);
                    }
                }
                else{
                    try{
                        const tabs = await queryTabs({active : true, lastFocusedWindow: true});
                        const t = tabs && tabs[0];
                        if(t && t.id){
                            try{
                                await doInjectScript(t.id , ["injected.js"]);
                            }
                            catch(err){
                                console.error("[BG] Injection fallback failed for tab:",t.id,err);
                            }
                        }
                        else{
                            console.warn("[BG] inject_page_script fallback could not find a tab to inject into");
                        }
                    }
                    catch(err){
                        console.error("[BG] tab.query failed during injection fallback:", err);
                    }
                }

                return;
            }


            if(message.action === "reportBug"){
                console.log("[AI Bug Reporter] capturing screenshot...");

                const targetWindowId = (sender && sender.tab && typeof sender.tab.windowId !== "undefined")
                    ? sender.tab.windowId
                    : null;

                let imageDataUrl;

                try{
                    imageDataUrl = await captureVisibleTab(targetWindowId, {format : "png"});
                }
                catch(err){
                    console.error("[AI Bug Reporter] Screenshot capture failed", err);
                    return;
                }

                if(!imageDataUrl){
                    console.error("[AI Bug Reporter] captureVisibleTab returned no data");
                    return;
                }

                const errorMessage = message.data?.error_message || message.data?.error || "error";
                const safeName = safeFileName(errorMessage);
                const ssFileName = `${safeName}_${Date.now()}.png`;

                const screenshotBlob = dataURLToBlob(imageDataUrl);

                const formData = new FormData();

                if(message.data && typeof message.data === "object"){
                    for(const [k,v] of Object.entries(message.data)){
                        if(k === "screenshot") continue;
                        if(v === undefined || v === null) continue;
                        if(typeof v === "object"){
                            try{
                                formData.append(k,JSON.stringify(v));
                            }
                            catch(e){
                                formData.append(k, String(v));
                            }
                        }
                        else{
                            formData.append(k,String(v));
                        }
                    }
                }

                formData.append("screenshot", screenshotBlob, ssFileName);

                console.log("[AI Bug Reporter] uploading bug , screenshot file:", ssFileName);

                try{
                    const resp = await fetch(DJANGO_API_URL, {
                        method:"POST",
                        body:formData
                    });

                    let respBody;
                    try{
                        respBody = await resp.text();
                    }
                    catch(e){
                        respBody = "<could not read response body>";
                    }

                    console.log("[AI Bug Reporter] bug uploaded response:", {
                        status: resp.status,
                        body: respBody
                    });
                }
                catch(err){
                    console.log("[AI Bug Reporter] failed to report bug(fetch error): ", err);
                }

                return;
            }

            console.log("[BG] unknown action:", message.action);
        }
        catch(e){
            console.error("[BG] unexpected error handling message:", e);
        }
    })();
});