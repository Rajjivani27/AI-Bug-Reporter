console.log("Injected.js running on page:", window.location.href);

(function() {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = function(...args){
    try {
      const errorObj = args.find(a => a instanceof Error);

      const errorData = {
        error_message: errorObj ? errorObj.message : args.join(" "),
        stack_trace: errorObj ? errorObj.stack : null,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      };

      window.postMessage({
        type:"AI_BUG_REPORTER_ERROR",
        data: errorData
      }, "*");
    }
    catch(e){
      console.error("Error:",e);
    }

    originalConsoleError.apply(console,args);
  };

  console.warn = function(...args){
    originalConsoleWarn.apply(console,args);
  };
})();

window.addEventListener("error", (event) => {
  try{
    console.log("I am here now");
    console.log("Injected.js caught error:", event.message);
    const errorData = {
      error_message: event.message,
      stack_trace: event.error ? event.error.stack : null,
      page_url: window.location.href,
      user_agent: navigator.userAgent,
    };
    window.postMessage({ type: "AI_BUG_REPORTER_ERROR", data: errorData }, "*");
  }
  catch(e){
    console.warn("Injected error handler failed:", e);
  }
});

window.addEventListener("unhandledrejection",(ev) => {
  try{
    const reason = ev.reason;
    const errorData = {
      error_message : (reason && reason.message) ? reason.message : String(reason),
      stack_trace : (reason && reason.stack) ? reason.stack : null,
      page_url : window.location.href,
      user_agent: navigator.userAgent,
    };
    window.postMessage({type : "AI_BUG_REPORTER_ERROR", data: errorData}, "*");
  }
  catch(e){
    console.warn("Injected rejection handler failed:",e);
  }
});
