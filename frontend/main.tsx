  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  if (import.meta.env.VITE_VERCEL !== '1') {
    throw new Error("Vercel execution hardening: Frontend is only allowed to run in the approved Vercel deployment environment.");
  }

  createRoot(document.getElementById("root")!).render(<App />);