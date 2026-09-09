"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Pedido = {
  id: number;
  jogador_id: number;
  tipo: string;
  ervas_quantidade: number;
  sementes_pacotes: number;
  fertilizante_quantidade: number;
  valor_total: number;
  status: string;
  created_at: string;
  jogadores?: {
    gamertag: string;
  } | {
    gamertag: string;
  }[];
};

type Item = {
  id: number;
  nome: string;
  categoria: string;
  valor: number;
};

const categorias = [
  { id: "armas", nome: "ARMAS", emoji: "🔫" },
  { id: "armas-brancas", nome: "ARMAS BRANCAS", emoji: "🔪" },
  { id: "comidas", nome: "COMIDAS", emoji: "🍖" },
  { id: "construcao", nome: "CONSTRUÇÃO", emoji: "🏗️" },
  { id: "explosivos", nome: "EXPLOSIVOS", emoji: "💣" },
  { id: "ferramentas", nome: "FERRAMENTAS", emoji: "🔧" },
  { id: "medicamentos", nome: "MEDICAMENTOS", emoji: "💊" },
  { id: "mochilas", nome: "MOCHILAS", emoji: "🎒" },
  { id: "municoes", nome: "MUNIÇÕES", emoji: "🔸" },
  { id: "pecas", nome: "PEÇAS", emoji: "⚙️" },
  { id: "veiculos", nome: "VEÍCULOS", emoji: "🚙" },
  { id: "exclusivos", nome: "EXCLUSIVOS", emoji: "⭐" },
  { id: "vestimentas", nome: "VESTIMENTAS", emoji: "👕" },
];

export default function Administracao() {
  useEffect(() => {
    async function verificarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.replace("/administracao/login");
        return;
      }

      const { data: adminAutorizado, error } =
        await supabase.rpc("is_admin");

      if (error || !adminAutorizado) {
        await supabase.auth.signOut();
        window.location.replace("/administracao/login");
      }
    }

    verificarSessao();
  }, []);

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [itens, setItens] = useState<Item[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [carregandoItens, setCarregandoItens] = useState(true);

  const [nomeProduto, setNomeProduto] = useState("");
  const [categoriaProduto, setCategoriaProduto] =
    useState("construcao");
  const [precoProduto, setPrecoProduto] = useState("");

  const [editandoId, setEditandoId] =
    useState<number | null>(null);

  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<string | null>(null);

  const [buscaProduto, setBuscaProduto] = useState("");

  const [tipoPedidos, setTipoPedidos] = useState<"abertos" | "finalizados">("abertos");

  const [pedidoAbertoId, setPedidoAbertoId] = useState<number | null>(null);

  const totalPedidos = pedidos.length;

  const pendentes = pedidos.filter(
    (pedido) => pedido.status !== "realizado"
  ).length;

  const realizados = pedidos.filter(
    (pedido) => pedido.status === "realizado"
  ).length;

  const ervasVendidas = pedidos
    .filter(
      (pedido) =>
        pedido.tipo === "venda" &&
        pedido.status === "realizado"
    )
    .reduce(
      (total, pedido) =>
        total + Number(pedido.ervas_quantidade || 0),
      0
    );

  async function carregarPedidos() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("pedidos")
      .select(`
        id,
        jogador_id,
        tipo,
        ervas_quantidade,
        sementes_pacotes,
        fertilizante_quantidade,
        valor_total,
        status,
        created_at,
        jogadores (
          gamertag
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setPedidos([]);
    } else {
      setPedidos((data || []) as Pedido[]);
    }

    setCarregando(false);
  }

  async function carregarItens() {
    setCarregandoItens(true);

    const { data, error } = await supabase
      .from("itens")
      .select("id, nome, categoria, valor")
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao carregar produtos:", error);
      setItens([]);
    } else {
      setItens((data || []) as Item[]);
    }

    setCarregandoItens(false);
  }

  async function adicionarProduto() {
    const nome = nomeProduto.trim();
    const valor = Number(precoProduto);

    if (!nome) {
      alert("Digite o nome do produto.");
      return;
    }

    if (!precoProduto || Number.isNaN(valor) || valor < 0) {
      alert("Digite um preço válido.");
      return;
    }

    if (!categoriaProduto) {
      alert("Selecione uma categoria.");
      return;
    }

    const { error } = await supabase
      .from("itens")
      .insert({
        nome,
        categoria: categoriaProduto,
        valor,
      });

    if (error) {
      console.error(
        "ERRO COMPLETO AO ADICIONAR PRODUTO:",
        error
      );

      alert(
        `Erro ao adicionar produto.\n\n${
          error.message || "Erro desconhecido."
        }`
      );

      return;
    }

    setNomeProduto("");
    setCategoriaProduto("construcao");
    setPrecoProduto("");

    await carregarItens();
  }

  function iniciarEdicao(item: Item) {
    setEditandoId(item.id);
    setNomeProduto(item.nome);
    setCategoriaProduto(item.categoria);
    setPrecoProduto(String(item.valor));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setNomeProduto("");
    setCategoriaProduto("construcao");
    setPrecoProduto("");
  }

  async function salvarEdicao() {
    if (editandoId === null) return;

    const nome = nomeProduto.trim();
    const valor = Number(precoProduto);

    if (!nome) {
      alert("Digite o nome do produto.");
      return;
    }

    if (!precoProduto || Number.isNaN(valor) || valor < 0) {
      alert("Digite um preço válido.");
      return;
    }

    if (!categoriaProduto) {
      alert("Selecione uma categoria.");
      return;
    }

    const { error } = await supabase
      .from("itens")
      .update({
        nome,
        categoria: categoriaProduto,
        valor,
      })
      .eq("id", editandoId);

    if (error) {
      console.error("Erro ao editar produto:", error);

      alert(
        `Erro ao editar produto.\n\n${
          error.message || "Erro desconhecido."
        }`
      );

      return;
    }

    cancelarEdicao();
    await carregarItens();
  }

  async function excluirProduto(item: Item) {
    const confirmar = window.confirm(
      `Excluir o produto "${item.nome}"? Esta ação não pode ser desfeita.`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("itens")
      .delete()
      .eq("id", item.id);

    if (error) {
      console.error("Erro ao excluir produto:", error);

      alert(
        `Erro ao excluir produto.\n\n${
          error.message || "Erro desconhecido."
        }`
      );

      return;
    }

    await carregarItens();
  }

  async function finalizarPedido(pedido: Pedido) {
    if (pedido.status === "realizado") return;

    const { data: pedidoRealizado, error } = await supabase
      .rpc("admin_marcar_pedido_realizado", {
        p_pedido_id: pedido.id,
      });

    if (error || !pedidoRealizado) {
      alert("Erro ao finalizar o pedido.");
      console.error(error);
      return;
    }

    await carregarPedidos();
  }

  async function excluirPedido(pedido: Pedido) {
    const confirmar = window.confirm(
      `Excluir o pedido #${pedido.id}? Esta ação não pode ser desfeita.`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("pedidos")
      .delete()
      .eq("id", pedido.id);

    if (error) {
      alert("Erro ao excluir o pedido.");
      console.error(error);
      return;
    }

    await carregarPedidos();
  }

  useEffect(() => {
    carregarPedidos();
    carregarItens();
  }, []);

  function getGamertag(pedido: Pedido) {
    if (!pedido.jogadores) return "Jogador";

    if (Array.isArray(pedido.jogadores)) {
      return pedido.jogadores[0]?.gamertag || "Jogador";
    }

    return pedido.jogadores.gamertag || "Jogador";
  }

  function nomeCategoria(categoria: string) {
    return (
      categorias.find((item) => item.id === categoria)?.nome ||
      categoria.toUpperCase()
    );
  }

  const itensCategoria = categoriaSelecionada
    ? itens.filter(
        (item) => item.categoria === categoriaSelecionada
      )
    : [];

  const itensFiltrados = itensCategoria.filter((item) => {
    const busca = buscaProduto.trim().toLowerCase();

    if (!busca) return true;

    return (
      item.nome.toLowerCase().includes(busca) ||
      String(item.id).includes(busca)
    );
  });

  const pedidosAbertos = pedidos.filter(
    (pedido) => pedido.status !== "realizado"
  );

  const pedidosFinalizados = pedidos.filter(
    (pedido) => pedido.status === "realizado"
  );

  const pedidosExibidos =
    tipoPedidos === "abertos"
      ? pedidosAbertos
      : pedidosFinalizados;

  return (
    <main className="page">
      <section className="hero admin-hero">
        <p className="eyebrow">HOLOCAUSTO Z</p>

        <h1>DISTRITO ZERO</h1>

        <p className="muted">
          Painel Administrativo
        </p>
      </section>

      <section className="admin-stats">
        <div className="admin-stat">
          <span>📦</span>
          <small>PEDIDOS TOTAIS</small>
          <strong>{totalPedidos}</strong>
        </div>

        <div className="admin-stat">
          <span>⏳</span>
          <small>PENDENTES</small>
          <strong>{pendentes}</strong>
        </div>

        <div className="admin-stat">
          <span>✅</span>
          <small>REALIZADOS</small>
          <strong>{realizados}</strong>
        </div>

        <div className="admin-stat">
          <span>🌿</span>
          <small>ERVAS VENDIDAS</small>
          <strong>
            {Number(ervasVendidas).toLocaleString("pt-BR")}
          </strong>
        </div>
      </section>

      <section className="panel">
        <h2>🛒 GERENCIAR LOJA</h2>
        <p style={{ marginTop: "4px", opacity: 0.7 }}>
          Selecione uma categoria para gerenciar os produtos.
        </p>

        {!categoriaSelecionada ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "7px",
              marginTop: "16px",
            }}
          >
            {categorias.map((categoria) => {
              const quantidade = itens.filter(
                (item) => item.categoria === categoria.id
              ).length;

              return (
                <button
                  key={categoria.id}
                  onClick={() => {
                    setCategoriaSelecionada(categoria.id);
                    setCategoriaProduto(categoria.id);
                    setBuscaProduto("");
                    setEditandoId(null);
                  }}
                  style={{
                    width: "100%",
                    minHeight: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 14px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: "9px",
                    color: "#fff",
                    textAlign: "left",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  <strong style={{ color: "#fff" }}>
                    {categoria.nome}
                  </strong>

                  <span
                    style={{
                      color: "#fff",
                      opacity: 0.7,
                      fontSize: "12px",
                    }}
                  >
                    {quantidade} {quantidade === 1 ? "item" : "itens"}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ marginTop: "14px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <div>
                <strong style={{ color: "#fff", fontSize: "15px" }}>
                  {nomeCategoria(categoriaSelecionada)}
                </strong>
                <div style={{ fontSize: "11px", opacity: 0.6 }}>
                  {itensCategoria.length}{" "}
                  {itensCategoria.length === 1 ? "item" : "itens"}
                </div>
              </div>

              <button
                onClick={() => {
                  setCategoriaSelecionada(null);
                  setBuscaProduto("");
                  setEditandoId(null);
                }}
                style={{
                  padding: "7px 10px",
                  fontSize: "11px",
                }}
              >
                ← CATEGORIAS
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "7px",
                padding: "10px",
                marginBottom: "12px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "9px",
              }}
            >
              <input
                value={nomeProduto}
                onChange={(e) => setNomeProduto(e.target.value)}
                placeholder="Nome do produto"
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  fontSize: "13px",
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: "7px",
                }}
              >
                <input
                  value={precoProduto}
                  onChange={(e) => setPrecoProduto(e.target.value)}
                  placeholder="Preço"
                  type="number"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "9px 10px",
                    fontSize: "13px",
                  }}
                />

                <select
                  value={categoriaProduto}
                  onChange={(e) => setCategoriaProduto(e.target.value)}
                  style={{
                    flex: 1.4,
                    minWidth: 0,
                    padding: "9px 8px",
                    fontSize: "12px",
                  }}
                >
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "7px" }}>
                {editandoId ? (
                  <>
                    <button
                      onClick={salvarEdicao}
                      style={{
                        flex: 1,
                        padding: "8px",
                        fontSize: "12px",
                      }}
                    >
                      SALVAR ALTERAÇÃO
                    </button>

                    <button
                      onClick={cancelarEdicao}
                      style={{
                        padding: "8px 10px",
                        fontSize: "12px",
                      }}
                    >
                      CANCELAR
                    </button>
                  </>
                ) : (
                  <button
                    onClick={adicionarProduto}
                    style={{
                      width: "100%",
                      padding: "8px",
                      fontSize: "12px",
                    }}
                  >
                    + ADICIONAR ITEM
                  </button>
                )}
              </div>
            </div>

            <div style={{ position: "relative", marginBottom: "10px" }}>
              <span
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  opacity: 0.6,
                  pointerEvents: "none",
                }}
              >
                🔎
              </span>

              <input
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
                placeholder="Pesquisar nesta categoria..."
                style={{
                  width: "100%",
                  padding: "9px 10px 9px 32px",
                  fontSize: "12px",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {itensFiltrados.length === 0 ? (
                <div
                  style={{
                    padding: "16px 10px",
                    textAlign: "center",
                    opacity: 0.6,
                    fontSize: "12px",
                  }}
                >
                  Nenhum produto encontrado.
                </div>
              ) : (
                itensFiltrados.map((item) => (
                  <article
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      padding: "8px 10px",
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <strong
                        style={{
                          display: "block",
                          color: "#fff",
                          fontSize: "12px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.nome}
                      </strong>

                      <span
                        style={{
                          fontSize: "10px",
                          opacity: 0.55,
                        }}
                      >
                        ID {item.id} • {item.valor} DZ Coins
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                        flexShrink: 0,
                      }}
                    >
                      <button
                        onClick={() => iniciarEdicao(item)}
                        style={{
                          padding: "6px 8px",
                          fontSize: "10px",
                        }}
                      >
                        EDITAR
                      </button>

                      <button
                        onClick={() => excluirProduto(item)}
                        style={{
                          padding: "6px 8px",
                          fontSize: "10px",
                        }}
                      >
                        EXCLUIR
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>📋 PEDIDOS</h2>

        <p className="muted">
          Separe os pedidos em andamento dos pedidos já concluídos.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "10px",
            marginTop: "18px",
          }}
        >
          <button
            type="button"
            onClick={() => setTipoPedidos("abertos")}
            style={{
              padding: "18px 12px",
              borderRadius: "12px",
              border:
                tipoPedidos === "abertos"
                  ? "2px solid currentColor"
                  : "1px solid rgba(255,255,255,0.15)",
              background:
                tipoPedidos === "abertos"
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(255,255,255,0.05)",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "25px",
              }}
            >
              🟠
            </span>

            <strong
              style={{
                display: "block",
                marginTop: "5px",
              }}
            >
              EM ABERTO
            </strong>

            <small
              style={{
                display: "block",
                marginTop: "4px",
                opacity: 0.7,
              }}
            >
              {pedidosAbertos.length}{" "}
              {pedidosAbertos.length === 1
                ? "pedido"
                : "pedidos"}
            </small>
          </button>

          <button
            type="button"
            onClick={() => setTipoPedidos("finalizados")}
            style={{
              padding: "18px 12px",
              borderRadius: "12px",
              border:
                tipoPedidos === "finalizados"
                  ? "2px solid currentColor"
                  : "1px solid rgba(255,255,255,0.15)",
              background:
                tipoPedidos === "finalizados"
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(255,255,255,0.05)",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "25px",
              }}
            >
              🟢
            </span>

            <strong
              style={{
                display: "block",
                marginTop: "5px",
              }}
            >
              FINALIZADOS
            </strong>

            <small
              style={{
                display: "block",
                marginTop: "4px",
                opacity: 0.7,
              }}
            >
              {pedidosFinalizados.length}{" "}
              {pedidosFinalizados.length === 1
                ? "pedido"
                : "pedidos"}
            </small>
          </button>
        </div>

        <div style={{ marginTop: "20px" }}>
          {carregando && (
            <p className="muted">
              Carregando pedidos...
            </p>
          )}

          {!carregando &&
            pedidosExibidos.length === 0 && (
              <p className="muted">
                {tipoPedidos === "abertos"
                  ? "Nenhum pedido em aberto."
                  : "Nenhum pedido finalizado."}
              </p>
            )}

          {!carregando &&
            pedidosExibidos.map((pedido) => (
              <article
                className="admin-order"
                key={pedido.id}
              >
                <div
                  onClick={() => {
                    if (tipoPedidos === "finalizados") {
                      setPedidoAbertoId(
                        pedidoAbertoId === pedido.id ? null : pedido.id
                      );
                    }
                  }}
                  style={{
                    cursor: tipoPedidos === "finalizados" ? "pointer" : "default",
                    flex: 1,
                  }}
                >
                  <b>#{pedido.id}</b>
                  <span>{getGamertag(pedido)}</span>
                  <small>
                    {pedido.tipo === "venda"
                      ? `Venda de ${Number(pedido.ervas_quantidade).toLocaleString("pt-BR")} ervas`
                      : `Compra: ${Number(pedido.sementes_pacotes).toLocaleString("pt-BR")} sementes + ${Number(pedido.fertilizante_quantidade).toLocaleString("pt-BR")} fertilizantes`}
                  </small>

                  {tipoPedidos === "finalizados" && pedidoAbertoId === pedido.id && (
                    <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.12)", fontSize: "12px", opacity: 0.8 }}>
                      <div><b>Jogador:</b> {getGamertag(pedido)}</div>
                      <div><b>Tipo:</b> {pedido.tipo === "venda" ? "Venda de ervas" : "Compra de sementes e fertilizantes"}</div>
                      {pedido.tipo === "venda" ? (
                        <div><b>Quantidade:</b> {Number(pedido.ervas_quantidade).toLocaleString("pt-BR")} ervas</div>
                      ) : (
                        <>
                          <div><b>Sementes:</b> {Number(pedido.sementes_pacotes).toLocaleString("pt-BR")} pacotes</div>
                          <div><b>Fertilizantes:</b> {Number(pedido.fertilizante_quantidade).toLocaleString("pt-BR")}</div>
                        </>
                      )}
                      <div><b>Valor total:</b> {Number(pedido.valor_total).toLocaleString("pt-BR")} DZ</div>
                      <div><b>Data:</b> {new Date(pedido.created_at).toLocaleString("pt-BR")}</div>
                      <div><b>Status:</b> ✓ Realizado</div>
                    </div>
                  )}
                </div>

                <div>
                  <strong>{Number(pedido.valor_total).toLocaleString("pt-BR")} DZ</strong>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      finalizarPedido(pedido);
                    }}
                    disabled={pedido.status === "realizado"}
                  >
                    {pedido.status === "realizado" ? "✓ Realizado" : "Marcar realizado"}
                  </button>
                  <button
                    type="button"
                    className="delete-order"
                    onClick={(e) => {
                      e.stopPropagation();
                      excluirPedido(pedido);
                    }}
                    title="Excluir pedido"
                    aria-label="Excluir pedido"
                  >
                    🗑️
                  </button>
                </div>
              </article>
            ))}
        </div>
      </section>
    </main>
  );
}
