
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Set document title based on environment
if (import.meta.env.DEV) {
  document.title = "Jarvis Design Dev";
} else {
  document.title = "Jarvis Design";
}

createRoot(document.getElementById("root")!).render(<App />);  