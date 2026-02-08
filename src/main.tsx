import './i18n';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent a third-party HelpPal widget domain-authorization error from blanking the app.
// (The widget is loaded in index.html and calls an external Supabase edge function.)
const setupHelpPalErrorGuards = () => {
  const isHelpPalAuthError = (err: unknown) => {
    const msg =
      typeof err === "string"
        ? err
        : err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "";

    return (
      msg.includes("Widget not authorized for this domain") ||
      msg.includes("chat-widget-api") ||
      msg.includes("Edge function returned 403")
    );
  };

  // 1) Catch unhandled async errors from the widget init.
  window.addEventListener("unhandledrejection", (event) => {
    if (isHelpPalAuthError(event.reason)) {
      event.preventDefault();
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("HelpPal widget blocked in this domain:", event.reason);
      }
    }
  });

  // 2) Catch sync errors bubbling from the widget script.
  window.addEventListener(
    "error",
    (event) => {
      if (isHelpPalAuthError((event as ErrorEvent).error ?? (event as ErrorEvent).message)) {
        event.preventDefault();
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("HelpPal widget blocked in this domain:", (event as ErrorEvent).message);
        }
      }
    },
    true
  );

  // 3) Wrap init() if/when HelpPalChat is attached.
  const wrapInit = (chat: any) => {
    if (!chat || typeof chat.init !== "function") return;

    const originalInit = chat.init.bind(chat);
    chat.init = (...args: any[]) => {
      try {
        const res = originalInit(...args);
        if (res && typeof res.then === "function") {
          return res.catch((e: unknown) => {
            if (isHelpPalAuthError(e)) return;
            throw e;
          });
        }
        return res;
      } catch (e) {
        if (isHelpPalAuthError(e)) return;
        throw e;
      }
    };
  };

  const w = window as any;
  if (w.HelpPalChat) wrapInit(w.HelpPalChat);

  try {
    let value = w.HelpPalChat;
    Object.defineProperty(window, "HelpPalChat", {
      configurable: true,
      get() {
        return value;
      },
      set(v) {
        value = v;
        wrapInit(v);
      },
    });
  } catch {
    // If defineProperty fails for any reason, ignore.
  }
};

setupHelpPalErrorGuards();

createRoot(document.getElementById("root")!).render(
  <App />
);

