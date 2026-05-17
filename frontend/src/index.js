import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const mountId = "root";
let container = document.getElementById(mountId);
if (!container) {
  container = document.createElement("div");
  container.id = mountId;
  document.body.appendChild(container);
}

const root = createRoot(container);
root.render(<App />);
