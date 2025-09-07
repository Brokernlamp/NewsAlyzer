import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker if available
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {
        // noop for now
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
