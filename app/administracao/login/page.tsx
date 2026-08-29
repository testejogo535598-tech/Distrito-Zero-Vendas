"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();

    setErro("");

    if (!email.trim() || !senha) {
      setErro("Informe o e-mail e a senha.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      console.error(error);
      setErro("E-mail ou senha incorretos.");
      setCarregando(false);
      return;
    }

    router.replace("/administracao");
  }

  return (
    <main className="login-page">
      <section className="login-box">
        <div className="login-icon">🔒</div>

        <p className="eyebrow">HOLOCAUSTO Z</p>

        <h1>DISTRITO ZERO</h1>

        <p className="muted">
          Painel Administrativo
        </p>

        <form onSubmit={entrar}>
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu e-mail"
              autoComplete="email"
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
              autoComplete="current-password"
            />
          </label>

          {erro && (
            <div className="login-error">
              {erro}
            </div>
          )}

          <button
            className="action"
            type="submit"
            disabled={carregando}
          >
            {carregando ? "ENTRANDO..." : "ENTRAR →"}
          </button>
        </form>
      </section>
    </main>
  );
}

