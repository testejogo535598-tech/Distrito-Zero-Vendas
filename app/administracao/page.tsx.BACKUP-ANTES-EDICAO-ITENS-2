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

export default function Administracao() {

  useEffect(() => {
    async function verificarSessao() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.replace("/administracao/login");
        return;
      }

      const { data: adminAutorizado, error } = await supabase.rpc("is_admin");

      if (error || !adminAutorizado) {
        await supabase.auth.signOut();
        window.location.replace("/administracao/login");
      }
    }
    verificarSessao();
  }, []);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);

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
    const confirmar = window.confirm(`Excluir o pedido #${pedido.id}? Esta ação não pode ser desfeita.`);

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
  }, []);

  function getGamertag(pedido: Pedido) {
    if (!pedido.jogadores) return "Jogador";

    if (Array.isArray(pedido.jogadores)) {
      return pedido.jogadores[0]?.gamertag || "Jogador";
    }

    return pedido.jogadores.gamertag || "Jogador";
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
        <strong>{Number(ervasVendidas).toLocaleString("pt-BR")}</strong>
      </div>

    </section>

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

        {[...pedidos].sort((a,b) => Number(a.status === "realizado") - Number(b.status === "realizado")).map((pedido) => (
          <article
            className="admin-order"
            key={pedido.id}
          >

            <div>

              <b>
                #{pedido.id}
              </b>

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
                ).toLocaleString("pt-BR")} DZ
              </strong>

              <button
                onClick={() =>
                  finalizarPedido(pedido)
                }
                disabled={
                  pedido.status === "realizado"
                }
              >
                {pedido.status === "realizado"
                  ? "✓ Realizado"
                  : "Marcar realizado"}
              </button>

              <button
                type="button"
                className="delete-order"
                onClick={() => excluirPedido(pedido)}
                title="Excluir pedido"
                aria-label="Excluir pedido"
              >
                🗑️
              </button>

            </div>

          </article>
        ))}

      </section>

    </main>
  );
}
