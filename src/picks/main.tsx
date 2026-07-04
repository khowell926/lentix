import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import { PicksApp } from "./PicksApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PicksApp />
  </StrictMode>
);
