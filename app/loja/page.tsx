"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type CategoriaLoja = {
  id: string;
  nome: string;
  emoji: string | null;
  imagem: string | null;
  descricao: string | null;
  ordem: number;
};

export default function Loja() {
  const [categorias, setCategorias] = useState<CategoriaLoja[]>([]);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarCategorias() {
      setCarregando(true);
      setErro(null);

      const { data, error } = await supabase
        .from("categorias")
        .select("id, nome, emoji, imagem, descricao, ordem")
        .eq("ativa", true)
        .order("ordem", { ascending: true });

      if (error) {
        console.error("Erro ao carregar categorias:", error);
        setErro("Não foi possível carregar as categorias da loja.");
        setCategorias([]);
        setCarregando(false);
        return;
      }

      setCategorias((data || []) as CategoriaLoja[]);
      setCarregando(false);
    }

    carregarCategorias();
  }, []);

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

            {carregando ? (
              <div className="notice">
                Carregando categorias...
              </div>
            ) : erro ? (
              <div className="notice">
                {erro}
              </div>
            ) : categorias.length === 0 ? (
              <div className="notice">
                Nenhuma categoria disponível no momento.
              </div>
            ) : (
              <div className="cards loja-categorias">
                {categorias.map((item) => (
                  <button
                    className="card"
                    key={item.id}
                    onClick={() => setCategoria(item.id)}
                  >
                    {item.imagem ? (
                      <img
                        src={item.imagem}
                        alt={item.nome}
                        style={{
                          width: "100%",
                          height: "160px",
                          objectFit: "cover",
                          borderRadius: "10px",
                          marginBottom: "10px",
                        }}
                      />
                    ) : (
                      <span>{item.emoji || "📦"}</span>
                    )}

                    <h3>{item.nome}</h3>

                    <p>
                      {item.descricao ||
                        "Itens disponíveis para compra"}
                    </p>

                    <b>ACESSAR →</b>
                  </button>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="panel">
            <h2>
              {selecionada?.emoji || "📦"} {selecionada?.nome}
            </h2>

            <p>
              {selecionada?.descricao ||
                "Itens disponíveis para compra"}
            </p>

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
