import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Enregistrer le Service Worker pour PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(reg => console.log("Service Worker enregistré:", reg.scope))
      .catch(err => console.log("Service Worker erreur:", err));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
