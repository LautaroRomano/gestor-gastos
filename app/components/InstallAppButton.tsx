"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Modal from "./Modal";

/** Evento no estándar de instalación de PWA (Chrome/Edge/Android). */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Botón "Instalar app".
 * - Chrome/Edge/Android: captura `beforeinstallprompt` y lanza el instalador nativo.
 * - iOS/Safari: no expone ese evento, así que muestra las instrucciones manuales.
 * - Si ya está instalada (display-mode: standalone), no renderiza nada.
 */
export function InstallAppButton({
  variant = "full",
  className,
}: {
  variant?: "full" | "compact";
  className?: string;
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    // ¿Ya está abierta/instalada como app?
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // Safari iOS usa esta propiedad no estándar.
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    // iOS/Safari no dispara beforeinstallprompt → instalación manual.
    const ua = window.navigator.userAgent;
    const iOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /^((?!chrome|crios|fxios|android).)*safari/i.test(ua);
    if (iOS && isSafari) setIsIOS(true);

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleClick() {
    if (deferred) {
      await deferred.prompt();
      try {
        const { outcome } = await deferred.userChoice;
        if (outcome === "accepted") setInstalled(true);
      } catch {
        // el usuario cerró el diálogo; sin acción
      }
      setDeferred(null);
      return;
    }
    if (isIOS) setShowIOSHelp(true);
  }

  // No mostrar si ya está instalada o si el navegador no permite instalar.
  if (installed || (!deferred && !isIOS)) return null;

  return (
    <>
      {variant === "compact" ? (
        <button
          onClick={handleClick}
          aria-label="Instalar app"
          className={cn(
            "tap grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent",
            className
          )}
        >
          <Download className="size-5" />
        </button>
      ) : (
        <Button
          onClick={handleClick}
          variant="outline"
          className={cn("h-11 w-full rounded-2xl text-[15px]", className)}
        >
          <Download className="size-5" />
          Instalar app
        </Button>
      )}

      <Modal
        isOpen={showIOSHelp}
        onClose={() => setShowIOSHelp(false)}
        title="Instalar en tu iPhone"
      >
        <div className="flex flex-col gap-4 pt-1 pb-2 text-sm">
          <p className="text-muted-foreground">
            Safari no instala apps de forma automática. Seguí estos pasos:
          </p>
          <ol className="flex flex-col gap-3">
            <li className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Share className="size-4" />
              </span>
              <span>
                Tocá el botón <strong>Compartir</strong> en la barra de Safari.
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <SquarePlus className="size-4" />
              </span>
              <span>
                Elegí <strong>Agregar a pantalla de inicio</strong>.
              </span>
            </li>
          </ol>
        </div>
      </Modal>
    </>
  );
}
