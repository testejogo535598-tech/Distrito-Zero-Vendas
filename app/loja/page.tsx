"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const categorias = [
  { id: "veiculos", image: "/loja/01-veiculos.jpg", title: "VEÍCULOS", text: "Veículos disponíveis para compra" },
  { id: "construcao", image: "/loja/02-construcao.jpg", title: "CONSTRUÇÃO", text: "Materiais e itens para construção" },
  { id: "armas-brancas", image: "/loja/03-armas-brancas.jpg", title: "ARMAS BRANCAS", text: "Equipamentos e lâminas disponíveis" },
  { id: "armas", image: "/loja/04-armas.jpg", title: "ARMAS", text: "Equipamentos disponíveis para compra" },
  { id: "explosivos", image: "/loja/05-explosivos.jpg", title: "EXPLOSIVOS", text: "Materiais explosivos disponíveis" },
  { id: "municao", image: "/loja/06-municao.jpg", title: "MUNIÇÃO", text: "Munições disponíveis para compra" },
  { id: "vestuario", image: "/loja/07-vestuario.jpg", title: "VESTUÁRIO", text: "Roupas e trajes disponíveis" },
  { id: "pecas", image: "/loja/08-pecas.jpg", title: "PEÇAS", text: "Peças e componentes para veículos" },
  { id: "especiais", image: "/loja/09-itens-exclusivos.jpg", title: "ITENS EXCLUSIVOS", text: "Itens especiais disponíveis por tempo limitado" },
];

type Item = {
  id: number;
  nome: string;
  categoria: string;
  valor: number;
};

export default function Loja() {
  const [categoria, setCategoria] = useState<string | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const selecionada = categorias.find((item) => item.id === categoria);

  useEffect(() => {
    if (!categoria) {
      setItens([]);
      setPesquisa("");
      return;
    }

    async function carregarItens() {
      setCarregando(true);
      setErro("");

      const { data, error } = await supabase
        .from("itens")
        .select("id, nome, categoria, valor")
        .eq("categoria", categoria)
        .order("id", { ascending: true });

      if (error) {
        console.error("Erro ao carregar itens:", error);
        setErro("Não foi possível carregar os produtos desta categoria.");
        setItens([]);
      } else {
        setItens(data || []);
      }

      setCarregando(false);
    }

    carregarItens();
  }, [categoria]);

  const itensFiltrados = itens.filter((item) =>
    item.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <main>
      <header className="hero">
        <div className="shade" />
        <div className="heroText">
          <small>SERVIDOR</small>
          <h1>HOLOCAUSTO&nbsp;Z</h1>
          <div className="logo">DISTRITO <b>ZERO</b></div>
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
            <p>Escolha uma categoria para visualizar os produtos disponíveis.</p>

            <div className="cards loja-categorias">
              {categorias.map((item) => (
                <button
                  className={`card ${item.id === "especiais" ? "cardEspecial" : ""}`}
                  key={item.id}
                  onClick={() => setCategoria(item.id)}
                >
                  <div className="cardImage">
                    <img src={item.image} alt={item.title} />
                  </div>

                  <h3>{item.title}</h3>

                  <p>{item.text}</p>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="panel">
            <h2>{selecionada?.title}</h2>

            <p>{selecionada?.text}</p>

            <div className="lojaPesquisa">
              <span>🔎</span>
              <input
                type="text"
                placeholder="Pesquisar produto..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
              />
            </div>

            {carregando && (
              <div className="notice">
                Carregando produtos...
              </div>
            )}

            {erro && (
              <div className="notice">
                {erro}
              </div>
            )}

            {!carregando && !erro && itensFiltrados.length === 0 && (
              <div className="notice">
                {pesquisa
                  ? "Nenhum produto encontrado."
                  : "Nenhum produto cadastrado nesta categoria."}
              </div>
            )}

            {!carregando && !erro && itensFiltrados.length > 0 && (
              <div className="produtosLista">
                {itensFiltrados.map((item) => (
                  <div className="produtoItem" key={item.id}>
                    <div>
                      <strong>{item.nome}</strong>
                      <small>{item.categoria}</small>
                    </div>

                    <b>{item.valor} DZ Coins</b>
                  </div>
                ))}
              </div>
            )}

            <button className="action" onClick={() => setCategoria(null)}>
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
