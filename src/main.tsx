import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
// @ts-ignore: module declaration for CSS imports is missing in this project
import "./index.css";

const rootElement = document.getElementById("root");

// Vercel reported a runtime "Cannot read properties of null (reading 'useRef')".
// If the script runs before the root element exists, createRoot would receive null
// and React would blow up deep inside its internals. Guard and fail gracefully.
if (!rootElement) {
  // Using console.error so the failure is visible but does not crash with an opaque stack.
  console.error("Root element #root not found. App did not mount.");
} else {
  createRoot(rootElement).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}