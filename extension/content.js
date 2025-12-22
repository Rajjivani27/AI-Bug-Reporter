console.log("Content script loaded successfully");

function showAuthToast(message){
    if(document.getElementById("ai-bug-toast")) return;

    const toast = document.createElement("div");
    toast.id = "ai-bug-toast";
    toast.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
            <img src="${chrome.runtime.getURL("icon.png")}"
                 width="18" height="18" />
            <strong>AI Bug Reporter</strong>
            <span style="opacity:.6;font-size:12px;">· Extension</span>
        </div>
        <div style="margin-top:6px;font-size:13px;">
            ${message}
        </div>
    `;

    Object.assign(toast.style, {
        position: "fixed",
        top: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#d32f2f",
        color: "#fff",
        padding: "12px 18px",
        borderRadius: "6px",
        fontSize: "14px",
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
        zIndex: 999999,
    });


    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

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
        return;
    }
});

chrome.runtime.onMessage.addListener((msg) => {
    if(msg.type === "SHOW_AUTH_TOAST"){
        console.log("Showing Toast");
        showAuthToast(msg.message);
    }
})