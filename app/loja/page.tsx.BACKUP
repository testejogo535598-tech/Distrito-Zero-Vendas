"use client";

import { useState } from "react";

const categorias = [
  { id: "veiculos", icon: "🚗", title: "VEÍCULOS", text: "Veículos disponíveis para compra" },
  { id: "construcao", icon: "🧱", title: "CONSTRUÇÃO", text: "Materiais e itens para construção" },
  { id: "armas-brancas", icon: "🔪", title: "ARMAS BRANCAS", text: "Equipamentos e lâminas disponíveis" },
  { id: "armas", icon: "🔫", title: "ARMAS", text: "Equipamentos disponíveis para compra" },
  { id: "explosivos", icon: "💣", title: "EXPLOSIVOS", text: "Materiais explosivos disponíveis" },
  { id: "municao", icon: "🎯", title: "MUNIÇÃO", text: "Munições disponíveis para compra" },
  { id: "vestuario", icon: "🥷", title: "VESTUÁRIO", text: "Roupas e trajes disponíveis" },
  { id: "pecas", icon: "🔧", title: "PEÇAS", text: "Peças e componentes para veículos" },
  { id: "especiais", icon: "✨", title: "ITENS EXCLUSIVOS", text: "Itens especiais disponíveis por tempo limitado" },
];

export default function Loja() {
  const [categoria, setCategoria] = useState<string | null>(null);

  const selecionada = categorias.find((item) => item.id === categoria);

  return (
    <main>
      <header className="hero">
        <div className="shade" />
        <div className="heroText">
          <small>SERVIDOR</small>
          <h1>HOLOCAUSTO&nbsp;Z</h1>
          <div className="logo">
            DISTRITO <b>ZERO</b>
          </div>
          <strong>LOJA DO DISTRITO</strong>
          <em>SUPRIMENTOS PARA SOBREVIVER.</em>
        </div>
      </header>

      <div className="wrap">
        <button
          className="backHome"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          ← INÍCIO
        </button>

        {!categoria ? (
          <section className="panel">
            <h2>🛒 LOJA</h2>

            <p>
              Escolha uma categoria para visualizar os produtos disponíveis.
            </p>

            <div className="cards loja-categorias">
              {categorias.map((item) => (
                <button
                  className={`card ${item.id === "especiais" ? "cardEspecial" : ""}`}
                  key={item.id}
                  onClick={() => setCategoria(item.id)}
                >
                  <span>{item.icon}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <b>ACESSAR →</b>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="panel">
            <h2>
              {selecionada?.icon} {selecionada?.title}
            </h2>

            <p>{selecionada?.text}</p>

            <div className="notice">
              Os produtos desta categoria serão adicionados posteriormente.
            </div>

            <button
              className="action"
              onClick={() => setCategoria(null)}
            >
              ← VOLTAR ÀS CATEGORIAS
            </button>
          </section>
        )}
      </div>

      <footer>
        DISTRITO ZERO • HOLOCAUSTO •{" "}
        <small>PRODUZA. VENDA. FORTALEÇA O SERVIDOR.</small>
      </footer>
    </main>
  );
}
