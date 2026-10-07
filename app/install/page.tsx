"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function InstallPage() {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    setInstalled(media.matches);

    const handler = () => setCanInstall(true);

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  async function install() {
    const event = (window as Window & {
      deferredPrompt?: {
        prompt: () => Promise<void>;
      };
    }).deferredPrompt;

    if (event) {
      await event.prompt();
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-4xl text-white">
            ə
          </div>

          <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Hotel Revenue Intelligence
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Install āprən Hotels
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            Put your hotel revenue console on your phone for faster access to
            opportunities, reservations, inventory signals and revenue actions.
          </p>

          {installed ? (
            <div className="mt-7 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
              The app is already installed on this device.
            </div>
          ) : canInstall ? (
            <button
              onClick={install}
              className="mt-7 w-full rounded-2xl bg-slate-900 px-5 py-4 font-medium text-white"
            >
              Install app
            </button>
          ) : (
            <div className="mt-7 rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-700">
              <strong>On Android:</strong> open this site in Chrome and use
              “Install app” or “Add to Home screen”.
              <br />
              <br />
              <strong>On iPhone:</strong> open the site in Safari, tap Share,
              then choose “Add to Home Screen”.
            </div>
          )}

          <Link
            href="/"
            className="mt-5 block text-center text-sm font-medium text-slate-600"
          >
            Continue to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
