import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Create container for React app
const container = document.createElement("div");
container.id = "react-chrome-app";
document.body.appendChild(container);

// Mount React app
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
