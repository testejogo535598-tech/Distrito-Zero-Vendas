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
  jogadores?:
    | {
        gamertag: string;
      }
    | {
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
  { id: "veiculos", nome: "VEÍCULOS" },
  { id: "construcao", nome: "CONSTRUÇÃO" },
  { id: "armas-brancas", nome: "ARMAS BRANCAS" },
  { id: "armas", nome: "ARMAS" },
  { id: "explosivos", nome: "EXPLOSIVOS" },
  { id: "municao", nome: "MUNIÇÃO" },
  { id: "vestuario", nome: "VESTUÁRIO" },
  { id: "pecas", nome: "PEÇAS" },
  { id: "especiais", nome: "ITENS EXCLUSIVOS" },
];

export default function Administracao() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [itens, setItens] = useState<Item[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [carregandoItens, setCarregandoItens] = useState(true);

  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  const [nomeProduto, setNomeProduto] = useState("");
  const [categoriaProduto, setCategoriaProduto] = useState("construcao");
  const [buscaProduto, setBuscaProduto] = useState("");
  const [precoProduto, setPrecoProduto] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);

  useEffect(() => {
    let montado = true;

    async function verificarSessao() {
      try {
        const {
          data: { user },
          error: erroUsuario,
        } = await supabase.auth.getUser();

        if (erroUsuario || !user) {
          window.location.replace("/administracao/login");
          return;
        }

        const {
          data: adminAutorizado,
          error: erroAdmin,
        } = await supabase.rpc("is_admin");

        if (erroAdmin) {
          console.error("Erro ao verificar administrador:", erroAdmin);
          return;
        }

        if (!adminAutorizado) {
          await supabase.auth.signOut();
          window.location.replace("/administracao/login");
          return;
        }

        if (montado) {
          setAutorizado(true);
          setVerificandoAcesso(false);
        }
      } catch (erro) {
        console.error("Erro ao verificar sessão:", erro);
      }
    }

    verificarSessao();

    return () => {
      montado = false;
    };
  }, []);

  useEffect(() => {
    if (!autorizado) return;

    carregarPedidos();
    carregarItens();
  }, [autorizado]);

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
        nome: nome,
        categoria: categoriaProduto,
        valor: valor,
      });

    if (error) {
      console.error("ERRO COMPLETO AO ADICIONAR PRODUTO:", error);
      alert(
        `Erro ao adicionar produto.\n\n${error.message || "Erro desconhecido."}`
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

    const { error } = await supabase
      .from("itens")
      .update({
        nome: nome,
        categoria: categoriaProduto,
        valor: valor,
      })
      .eq("id", editandoId);

    if (error) {
      console.error("Erro ao editar produto:", error);
      alert(
        `Erro ao editar produto.\n\n${error.message || "Erro desconhecido."}`
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
        `Erro ao excluir produto.\n\n${error.message || "Erro desconhecido."}`
      );
      return;
    }

    await carregarItens();
  }

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

  if (verificandoAcesso) {
    return (
      <main className="page">
        <section className="hero admin-hero">
          <p className="eyebrow">HOLOCAUSTO Z</p>

          <h1>DISTRITO ZERO</h1>

          <p className="muted">
            Verificando acesso administrativo...
          </p>
        </section>
      </main>
    );
  }

  if (!autorizado) {
    return null;
  }

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

      {/* GERENCIAR LOJA */}

      <section className="panel">

        <h2>🛒 GERENCIAR LOJA</h2>

        <p className="muted">
          Adicione, edite ou exclua os produtos disponíveis na Loja.
        </p>

        <input
          type="text"
          placeholder="Nome do produto"
          value={nomeProduto}
          onChange={(e) => setNomeProduto(e.target.value)}
        />

        <select
          value={categoriaProduto}
          onChange={(e) => setCategoriaProduto(e.target.value)}
        >
          {categorias.map((categoria) => (
            <option
              key={categoria.id}
              value={categoria.id}
            >
              {categoria.nome}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Preço em DZ Coins"
          value={precoProduto}
          onChange={(e) => setPrecoProduto(e.target.value)}
        />

        {editandoId === null ? (
          <button
            type="button"
            onClick={adicionarProduto}
          >
            ➕ ADICIONAR PRODUTO
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={salvarEdicao}
            >
              💾 SALVAR ALTERAÇÕES
            </button>

            <button
              type="button"
              onClick={cancelarEdicao}
            >
              ❌ CANCELAR
            </button>
          </>
        )}

        <input
          type="text"
          placeholder="🔎 Buscar produto por nome, categoria ou ID"
          value={buscaProduto}
          onChange={(e) => setBuscaProduto(e.target.value)}
          style={{ marginTop: "16px" }}
        />

        <div style={{ marginTop: "20px" }}>

          {carregandoItens && (
            <p className="muted">
              Carregando produtos...
            </p>
          )}

          {!carregandoItens && itens.length === 0 && (
            <p className="muted">
              Nenhum produto cadastrado.
            </p>
          )}
          {!carregandoItens &&
            categorias.map((categoria) => {
              const termo = buscaProduto.trim().toLowerCase();

              const produtosCategoria = itens.filter((item) => {
                const correspondeCategoria = item.categoria === categoria.id;

                if (!correspondeCategoria) return false;
                if (!termo) return true;

                return (
                  item.nome.toLowerCase().includes(termo) ||
                  nomeCategoria(item.categoria).toLowerCase().includes(termo) ||
                  String(item.id).includes(termo)
                );
              });

              return (
                <details
                  className="admin-product-group"
                  key={categoria.id}
                >
                  <summary>
                    <span>{categoria.nome}</span>
                    <strong>{produtosCategoria.length}</strong>
                  </summary>

                  <div className="admin-product-list">
                    {produtosCategoria.length === 0 ? (
                      <p className="muted admin-product-empty">
                        Nenhum produto nesta categoria.
                      </p>
                    ) : (
                      produtosCategoria.map((item) => (
                        <article
                          key={item.id}
                          className="admin-product"
                        >

                          <div>
                            <b>{item.nome}</b>

                            <span>
                              {nomeCategoria(item.categoria)}
                            </span>

                            <small>
                              ID: {item.id}
                            </small>
                          </div>

                          <div>
                            <strong>
                              {Number(item.valor).toLocaleString("pt-BR")} DZ
                            </strong>

                            <button
                              type="button"
                              onClick={() => iniciarEdicao(item)}
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              className="delete-order"
                              onClick={() => excluirProduto(item)}
                              title="Excluir produto"
                              aria-label="Excluir produto"
                            >
                              🗑️
                            </button>
                          </div>

                        </article>
                      ))
                    )}
                  </div>
                </details>
              );
            })}
        </div>

      </section>        {/* PEDIDOS */}

        <section className="panel">

          <h2>📋 PEDIDOS</h2>

          {carregando && (
            <p className="muted">
              Carregando pedidos...
            </p>
          )}

          {!carregando && pedidos.length === 0 && (
            <p className="muted">
              Nenhum pedido encontrado.
            </p>
          )}

          {!carregando && pedidos.length > 0 && (
            <>
              <details className="admin-order-group" open>
                <summary>
                  <span>🆕 NOVOS PEDIDOS</span>
                  <strong>
                    {pedidos.filter(
                      (pedido) => pedido.status !== "realizado"
                    ).length}
                  </strong>
                </summary>

                <div className="admin-order-list">
                  {pedidos
                    .filter(
                      (pedido) => pedido.status !== "realizado"
                    )
                    .map((pedido) => (
                      <article
                        className="admin-order"
                        key={pedido.id}
                      >
                        <div>
                          <b>#{pedido.id}</b>

                          <span>
                            {getGamertag(pedido)}
                          </span>

                          <small>
                            {pedido.tipo === "venda"
                              ? `Venda de ${Number(
                                  pedido.ervas_quantidade
                                ).toLocaleString("pt-BR")} ervas`
                              : `Compra: ${Number(
                                  pedido.sementes_pacotes
                                )} sementes + ${Number(
                                  pedido.fertilizante_quantidade
                                )} fertilizantes`}
                          </small>
                        </div>

                        <div>
                          <strong>
                            {Number(
                              pedido.valor_total
                            ).toLocaleString("pt-BR")}{" "}
                            DZ
                          </strong>

                          <button
                            onClick={() =>
                              finalizarPedido(pedido)
                            }
                          >
                            Marcar realizado
                          </button>

                          <button
                            type="button"
                            className="delete-order"
                            onClick={() =>
                              excluirPedido(pedido)
                            }
                            title="Excluir pedido"
                            aria-label="Excluir pedido"
                          >
                            🗑️
                          </button>
                        </div>
                      </article>
                    ))}
                </div>
              </details>

              <details className="admin-order-group">
                <summary>
                  <span>✅ PEDIDOS FINALIZADOS</span>
                  <strong>
                    {pedidos.filter(
                      (pedido) => pedido.status === "realizado"
                    ).length}
                  </strong>
                </summary>

                <div className="admin-order-list">
                  {pedidos
                    .filter(
                      (pedido) => pedido.status === "realizado"
                    )
                    .map((pedido) => (
                      <article
                        className="admin-order"
                        key={pedido.id}
                      >
                        <div>
                          <b>#{pedido.id}</b>

                          <span>
                            {getGamertag(pedido)}
                          </span>

                          <small>
                            {pedido.tipo === "venda"
                              ? `Venda de ${Number(
                                  pedido.ervas_quantidade
                                ).toLocaleString("pt-BR")} ervas`
                              : `Compra: ${Number(
                                  pedido.sementes_pacotes
                                )} sementes + ${Number(
                                  pedido.fertilizante_quantidade
                                )} fertilizantes`}
                          </small>
                        </div>

                        <div>
                          <strong>
                            {Number(
                              pedido.valor_total
                            ).toLocaleString("pt-BR")}{" "}
                            DZ
                          </strong>

                          <button disabled>
                            ✓ Realizado
                          </button>

                          <button
                            type="button"
                            className="delete-order"
                            onClick={() =>
                              excluirPedido(pedido)
                            }
                            title="Excluir pedido"
                            aria-label="Excluir pedido"
                          >
                            🗑️
                          </button>
                        </div>
                      </article>
                    ))}
                </div>
              </details>
            </>
          )}

        </section>

    </main>
  );
}
