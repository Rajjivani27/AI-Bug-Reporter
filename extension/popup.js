const API_BASE = "http://127.0.0.1:8000/api/token/";

document.getElementById("loginForm").addEventListener("submit",async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_BASE}`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({email,password}),
    });

    if(!res.ok){
        const statusText = res.statusText ? `: ${res.statusText}` : 'Nothing';
        console.error(res);
        document.getElementById("status").textContent = "Login Failed!" + statusText;
        return;
    }

    const data = await res.json();

    await chrome.storage.sync.set({
        accessToken: data.access,
        refreshToken: data.refresh,
    });

    document.getElementById("status").textContent = "Logged In!";
})