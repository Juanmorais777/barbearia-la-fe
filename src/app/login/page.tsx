
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/hooks/useApi";
import {
  ErrorBox,
  btnPrimary,
  inputClass,
  labelClass,
} from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      router.replace("/admin/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível entrar.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hero-grid flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/60 font-display text-xl text-gold">
            LF
          </span>

          <span className="font-display mt-3 block text-2xl">
            BARBEARIA <span className="gold-text">LA FÉ</span>
          </span>

          <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            Painel administrativo
          </span>
        </Link>

        <form
          onSubmit={submit}
          className="card space-y-4 p-6"
          autoComplete="off"
        >
          <div>
            <label
              className={labelClass}
              htmlFor="email"
            >
              E-mail
            </label>

            <input
              id="email"
              name="login-email"
              type="email"
              autoComplete="off"
              className={inputClass}
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />
          </div>

          <div>
            <label
              className={labelClass}
              htmlFor="password"
            >
              Senha
            </label>

            <input
              id="password"
              name="login-password"
              type="password"
              autoComplete="new-password"
              className={inputClass}
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />
          </div>

          {error ? (
            <ErrorBox message={error} />
          ) : null}

          <button
            type="submit"
            className={`${btnPrimary} w-full`}
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <Link
            href="/"
            className="block text-center text-xs text-zinc-500 hover:text-gold"
          >
            Voltar para o site
          </Link>
        </form>
      </div>
    </div>
  );
}

