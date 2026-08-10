"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import { InstallAppButton } from "./components/InstallAppButton";
import { Screen, ScreenLoader } from "@/components/mobile/shell";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        try {
          const lastMesId = localStorage.getItem("lastMesId");
          if (lastMesId) {
            router.push(`/meses/${lastMesId}`);
          } else {
            router.push("/dashboard");
          }
        } catch {
          router.push("/dashboard");
        }
      }
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <ScreenLoader />;

  return (
    <Screen>
      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-16 size-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-40 -left-20 size-72 rounded-full bg-[var(--hero-to)]/10 blur-3xl" />
      </div>

      <div className="relative flex flex-1 flex-col justify-center px-6 py-10">
        {/* Marca */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-12">
            <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Wallet className="size-7" strokeWidth={2} />
            </div>
            <h1 className="font-display text-[2.1rem] font-bold leading-[1.05] tracking-tight">
              Gestor de
              <br />
              Gastos
            </h1>
            <p className="mt-3 max-w-[30ch] text-[15px] text-muted-foreground">
              Registrá tus ingresos y egresos, y seguí tu balance con claridad.
            </p>
          </div>
        </motion.div>

        {/* Segmented control */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative mb-6 grid grid-cols-2 rounded-2xl border border-border bg-muted/60 p-1">
            {(
              [
                ["login", "Iniciar sesión"],
                ["register", "Registrarme"],
              ] as const
            ).map(([key, label]) => {
              const active = (key === "login") === isLogin;
              return (
                <button
                  key={key}
                  onClick={() => setIsLogin(key === "login")}
                  className="relative z-10 rounded-xl py-2.5 text-sm font-semibold transition-colors"
                >
                  {active && (
                    <motion.span
                      layoutId="auth-pill"
                      transition={{
                        type: "spring",
                        damping: 30,
                        stiffness: 350,
                      }}
                      className="absolute inset-0 -z-10 rounded-xl bg-card shadow-sm"
                    />
                  )}
                  <span
                    className={
                      active ? "text-foreground" : "text-muted-foreground"
                    }
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          <motion.div
            key={isLogin ? "login" : "register"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {isLogin ? (
              <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
            )}
          </motion.div>

          <div className="mt-6">
            <InstallAppButton />
          </div>
        </motion.div>
      </div>
    </Screen>
  );
}
