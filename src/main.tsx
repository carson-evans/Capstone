import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/index.css"; // keep if this exists; otherwise remove/adjust

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);