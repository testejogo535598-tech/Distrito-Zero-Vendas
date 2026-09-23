"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type PedidoItem = {
  id: number;
  pedido_id: number;
  produto_id: number;
  nome_produto: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
  tipo_valor?: "dzcoins" | "real";
};

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
  pedido_itens?: PedidoItem[];
  jogadores?: {
    gamertag: string;
  } | {
    gamertag: string;
  }[];
};

type TipoValor = "dzcoins" | "real";

type Item = {
  id: number;
  nome: string;
  categoria: string;
  valor: number;
  tipo_valor: TipoValor;
  ordem: number;
};

type Categoria = {
  id: string;
  nome: string;
  emoji: string | null;
  imagem: string | null;
  descricao: string | null;
  ordem: number;
  ativa: boolean;
};

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
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [nomeCategoria, setNomeCategoria] = useState("");
  const [idCategoria, setIdCategoria] = useState("");
  const [emojiCategoria, setEmojiCategoria] = useState("📦");
  const [imagemCategoria, setImagemCategoria] = useState("");
  const [arquivoImagemCategoria, setArquivoImagemCategoria] =
    useState<File | null>(null);
  const [enviandoImagemCategoria, setEnviandoImagemCategoria] =
    useState(false);
  const [descricaoCategoria, setDescricaoCategoria] = useState("");
  const [ordemCategoria, setOrdemCategoria] = useState("");
  const [editandoCategoriaId, setEditandoCategoriaId] = useState<string | null>(null);

  async function enviarImagemCategoria(): Promise<string | null> {
    if (!arquivoImagemCategoria) {
      return imagemCategoria.trim() || null;
    }

    setEnviandoImagemCategoria(true);

    try {
      const extensao =
        arquivoImagemCategoria.name.split(".").pop()?.toLowerCase() || "webp";

      const nomeArquivo =
        `categoria-${crypto.randomUUID()}.${extensao}`;

      const { error: uploadError } = await supabase.storage
        .from("Categorias")
        .upload(nomeArquivo, arquivoImagemCategoria, {
          cacheControl: "3600",
          upsert: false,
          contentType:
            arquivoImagemCategoria.type || "image/webp",
        });

      if (uploadError) {
        console.error("Erro ao enviar imagem:", uploadError);
        alert(
          `Erro ao enviar a imagem.\\n\\n${uploadError.message || "Erro desconhecido."}`
        );
        return null;
      }

      const { data } = supabase.storage
        .from("Categorias")
        .getPublicUrl(nomeArquivo);

      return data.publicUrl;
    } finally {
      setEnviandoImagemCategoria(false);
    }
  }

  const [carregando, setCarregando] = useState(true);
  const [carregandoItens, setCarregandoItens] = useState(true);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);

  const [nomeProduto, setNomeProduto] = useState("");
  const [categoriaProduto, setCategoriaProduto] =
    useState("construcao");
  const [precoProduto, setPrecoProduto] = useState("");
  const [tipoValorProduto, setTipoValorProduto] = useState<TipoValor>("dzcoins");

  const [editandoId, setEditandoId] =
    useState<number | null>(null);

  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<string | null>(null);

  const [buscaCategoria, setBuscaCategoria] = useState("");

  const [buscaProduto, setBuscaProduto] = useState("");

  const [modoGerenciador, setModoGerenciador] =
    useState<"adicionar" | "editar" | null>(null);

  const [tipoGerenciador, setTipoGerenciador] =
    useState<"categoria" | "item" | null>(null);

    const [gerenciandoPosicoes, setGerenciandoPosicoes] =
      useState(false);

    const [categoriaPosicoesSelecionada, setCategoriaPosicoesSelecionada] =
      useState<string | null>(null);

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

  async function formatarValorPedidoAdmin(valor: number, tipo: "dzcoins" | "real") {
  if (tipo === "real") {
    return (Number(valor) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return `${Number(valor).toLocaleString("pt-BR")} DZ Coins`;
}

function obterTipoValorPedido(pedido: any): "dzcoins" | "real" {
  const tipo = pedido?.pedido_itens?.[0]?.tipo_valor;
  return tipo === "real" ? "real" : "dzcoins";
}

function formatarValorPedidoAdminComPedido(valor: number, pedido: any) {
  return formatarValorPedidoAdmin(valor, obterTipoValorPedido(pedido));
}

async function carregarPedidos() {
    setCarregando(true);

    const { data: pedidosData, error: pedidosError } = await supabase
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

    if (pedidosError) {
      console.error("Erro ao carregar pedidos:", pedidosError);
      setPedidos([]);
      setCarregando(false);
      return;
    }

    const ids = (pedidosData || []).map((pedido: any) => pedido.id);

    const { data: itensData, error: itensError } = ids.length
      ? await supabase
          .from("pedido_itens")
          .select(`
            id,
            pedido_id,
            produto_id,
            nome_produto,
            quantidade,
            valor_unitario,
            subtotal
        tipo_valor,
          `)
          .in("pedido_id", ids)
      : { data: [], error: null };

    if (itensError) {
      console.error("Erro ao carregar itens dos pedidos:", itensError);
    }

    const pedidosComItens = (pedidosData || []).map((pedido: any) => ({
      ...pedido,
      pedido_itens: (itensData || []).filter(
        (item: any) => item.pedido_id === pedido.id
      ),
    }));

    setPedidos(pedidosComItens as Pedido[]);
    setCarregando(false);
  }

  async function carregarCategorias() {
    const { data, error } = await supabase
      .from("categorias")
      .select("id, nome, emoji, imagem, descricao, ordem, ativa")
      .eq("ativa", true)
      .order("ordem", { ascending: true });

    if (error) {
      console.error("Erro ao carregar categorias:", error);
      setCategorias([]);
      return;
    }

    setCategorias((data || []) as Categoria[]);
  }

  async function moverItem(itemId: number, direcao: "cima" | "baixo") {
    if (salvandoOrdem || !categoriaSelecionada || buscaProduto.trim()) return;

    const lista = itens
      .filter((item) => item.categoria === categoriaSelecionada)
      .sort((a, b) => {
        const ordemA = Number(a.ordem ?? 0);
        const ordemB = Number(b.ordem ?? 0);
        return ordemA - ordemB || a.id - b.id;
      });

    const indiceAtual = lista.findIndex((item) => item.id === itemId);

    if (indiceAtual === -1) return;

    const novoIndice =
      direcao === "cima"
        ? indiceAtual - 1
        : indiceAtual + 1;

    if (novoIndice < 0 || novoIndice >= lista.length) return;

    const novaLista = [...lista];
    const itemAtual = novaLista[indiceAtual];

    novaLista[indiceAtual] = novaLista[novoIndice];
    novaLista[novoIndice] = itemAtual;

    const novaOrdem = novaLista.map((item, index) => ({
      ...item,
      ordem: index + 1,
    }));

    setSalvandoOrdem(true);

    try {
      const resultados = await Promise.all(
        novaOrdem.map((item) =>
          supabase
            .from("itens")
            .update({ ordem: item.ordem })
            .eq("id", item.id)
        )
      );

      const erro = resultados.find((resultado) => resultado.error);

      if (erro?.error) {
        console.error("Erro ao salvar ordem dos produtos:", erro.error);
        alert("Não foi possível salvar a nova ordem.");
        return;
      }

      setItens((anteriores) =>
        anteriores.map((item) => {
          const atualizado = novaOrdem.find(
            (novo) => novo.id === item.id
          );

          return atualizado || item;
        })
      );
    } finally {
      setSalvandoOrdem(false);
    }
  }

  async function carregarItens() {
    setCarregandoItens(true);

    const { data, error } = await supabase
      .from("itens")
      .select("id, nome, categoria, valor, ordem")
      .order("categoria", { ascending: true })
      .order("ordem", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.error("Erro ao carregar produtos:", error);
      setItens([]);
    } else {
      setItens((data || []) as Item[]);
    }

    setCarregandoItens(false);
  }

  function normalizarIdCategoria(valor: string) {
    return valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function limparFormularioCategoria() {
    setNomeCategoria("");
    setIdCategoria("");
    setEmojiCategoria("📦");
    setImagemCategoria("");
    setArquivoImagemCategoria(null);
    setDescricaoCategoria("");
    setOrdemCategoria("");
    setEditandoCategoriaId(null);
  }

  async function adicionarCategoria() {
    const nome = nomeCategoria.trim();
    const id = normalizarIdCategoria(idCategoria || nome);
    const emoji = emojiCategoria.trim() || "📦";
    const descricao = descricaoCategoria.trim() || null;

    if (!nome) {
      alert("Digite o nome da categoria.");
      return;
    }

    if (!id) {
      alert("Digite um identificador válido para a categoria.");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(id)) {
      alert("O identificador deve conter apenas letras minúsculas, números e hífen.");
      return;
    }

    const ordemInformada = ordemCategoria.trim()
      ? Number(ordemCategoria)
      : categorias.length + 1;

    if (Number.isNaN(ordemInformada) || ordemInformada < 0) {
      alert("Digite uma ordem válida.");
      return;
    }

    const { data: existente } = await supabase
      .from("categorias")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existente) {
      alert("Já existe uma categoria com esse identificador.");
      return;
    }

    const imagem = await enviarImagemCategoria();

    if (arquivoImagemCategoria && !imagem) {
      return;
    }

    const { error } = await supabase
      .from("categorias")
      .insert({
        id,
        nome,
        emoji,
        imagem,
        descricao,
        ordem: ordemInformada,
        ativa: true,
      });

    if (error) {
      console.error("Erro ao adicionar categoria:", error);
      alert(
        `Erro ao adicionar categoria.\\n\\n${error.message || "Erro desconhecido."}`
      );
      return;
    }

    limparFormularioCategoria();
    await carregarCategorias();

    alert("Categoria criada com sucesso!");
  }

  function iniciarEdicaoCategoria(categoria: Categoria) {
    setEditandoCategoriaId(categoria.id);
    setNomeCategoria(categoria.nome);
    setIdCategoria(categoria.id);
    setEmojiCategoria(categoria.emoji || "📦");
    setImagemCategoria(categoria.imagem || "");
    setArquivoImagemCategoria(null);
    setDescricaoCategoria(categoria.descricao || "");
    setOrdemCategoria(String(categoria.ordem));
  }

  function cancelarEdicaoCategoria() {
    limparFormularioCategoria();
  }

  async function salvarEdicaoCategoria() {
    if (!editandoCategoriaId) return;

    const nome = nomeCategoria.trim();
    const emoji = emojiCategoria.trim() || "📦";
    const descricao = descricaoCategoria.trim() || null;

    const ordemInformada = ordemCategoria.trim()
      ? Number(ordemCategoria)
      : 0;

    if (!nome) {
      alert("Digite o nome da categoria.");
      return;
    }

    if (Number.isNaN(ordemInformada) || ordemInformada < 0) {
      alert("Digite uma ordem válida.");
      return;
    }

    const imagem = await enviarImagemCategoria();

    if (arquivoImagemCategoria && !imagem) {
      return;
    }

    const { error } = await supabase
      .from("categorias")
      .update({
        nome,
        emoji,
        imagem,
        descricao,
        ordem: ordemInformada,
      })
      .eq("id", editandoCategoriaId);

    if (error) {
      console.error("Erro ao editar categoria:", error);
      alert(
        `Erro ao editar categoria.\\n\\n${error.message || "Erro desconhecido."}`
      );
      return;
    }

    limparFormularioCategoria();
    await carregarCategorias();

    alert("Categoria atualizada com sucesso!");
  }

  async function excluirCategoria(categoria: Categoria) {
    const quantidade = itens.filter(
      (item) => item.categoria === categoria.id
    ).length;

    if (quantidade > 0) {
      alert(
        `Não é possível excluir a categoria "${categoria.nome}".

Ela possui ${quantidade} ${quantidade === 1 ? "produto vinculado" : "produtos vinculados"}.

Remova ou mova os produtos dessa categoria antes de excluí-la.`
      );
      return;
    }

    const confirmar = window.confirm(
      `Excluir definitivamente a categoria "${categoria.nome}"?

Essa ação não poderá ser desfeita.`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("categorias")
      .delete()
      .eq("id", categoria.id);

    if (error) {
      console.error("Erro ao excluir categoria:", error);
      alert(
        `Erro ao excluir categoria.\\n\\n${error.message || "Erro desconhecido."}`
      );
      return;
    }

    if (categoriaSelecionada === categoria.id) {
      setCategoriaSelecionada(null);
      setBuscaProduto("");
      setEditandoId(null);
    }

    await carregarCategorias();

    alert("Categoria excluída com sucesso!");
  }

  function converterPrecoParaBanco(valorTexto: string, tipo: TipoValor) {
    const texto = valorTexto.trim().replace(/\s/g, "");

    if (!texto) return NaN;

    if (tipo === "real") {
      let normalizado = texto;

      if (normalizado.includes(",") && normalizado.includes(".")) {
        normalizado = normalizado.replace(/\./g, "").replace(",", ".");
      } else if (normalizado.includes(",")) {
        normalizado = normalizado.replace(",", ".");
      }

      const valor = Number(normalizado);

      if (!Number.isFinite(valor) || valor < 0) return NaN;

      return Math.round(valor * 100);
    }

    const valor = Number(texto.replace(/[^\d]/g, ""));

    if (!Number.isFinite(valor) || valor < 0) return NaN;

    return Math.round(valor);
  }

  function formatarValorAdmin(valor: number, tipo: TipoValor) {
    if (tipo === "real") {
      return (Number(valor) / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    }

    return `${Number(valor).toLocaleString("pt-BR")} DZ Coins`;
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
              tipo_valor: tipoValorProduto,
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
    setPrecoProduto(
      item.tipo_valor === "real"
        ? (Number(item.valor) / 100).toFixed(2).replace(".", ",")
        : String(item.valor)
    );
    setTipoValorProduto(item.tipo_valor === "real" ? "real" : "dzcoins");

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
    setTipoValorProduto("dzcoins");
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
    carregarCategorias();
  }, []);

  function getGamertag(pedido: Pedido) {
    if (!pedido.jogadores) return "Jogador";

    if (Array.isArray(pedido.jogadores)) {
      return pedido.jogadores[0]?.gamertag || "Jogador";
    }

    return pedido.jogadores.gamertag || "Jogador";
  }

  function obterNomeCategoria(categoria: string) {
    return (
      categorias.find((item) => item.id === categoria)?.nome ||
      categoria.toUpperCase()
    );
  }

  const itensCategoria = categoriaSelecionada
    ? itens
        .filter(
          (item) => item.categoria === categoriaSelecionada
        )
        .sort((a, b) => {
          const ordemA = Number(a.ordem ?? 0);
          const ordemB = Number(b.ordem ?? 0);
          return ordemA - ordemB || a.id - b.id;
        })
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
      <section
        className="hero admin-hero"
        style={{ position: "relative" }}
      >
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.replace("/");
          }}
          aria-label="Sair"
          title="Sair"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            padding: "7px 10px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.18)",
            fontSize: "11px",
            opacity: 0.8,
            cursor: "pointer",
          }}
        >
          🚪
        </button>

        <p className="eyebrow">HOLOCAUSTO Z</p>

        <h1>DISTRITO ZERO</h1>

        <p className="muted">
          Painel Administrativo
        </p>
      </section>

      <section className="admin-stats">
        <div className="admin-stat">
          <span>🌿</span>
          <small>ERVAS VENDIDAS</small>
          <strong>
            {Number(ervasVendidas).toLocaleString("pt-BR")}
          </strong>
        </div>
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
                      : pedido.tipo === "loja" ? `Compra na Loja: ${pedido.pedido_itens?.length || 0} itens` : `Compra: ${Number(pedido.sementes_pacotes).toLocaleString("pt-BR")} sementes + ${Number(pedido.fertilizante_quantidade).toLocaleString("pt-BR")} fertilizantes`}
                  </small>

                  {pedido.tipo === "loja" && pedido.pedido_itens?.length ? (
                    <div style={{ marginTop: "6px", fontSize: "11px", opacity: 0.8 }}>
                      {pedido.pedido_itens.map((item) => (
                        <div key={item.id}>
                          • {item.nome_produto} × {item.quantidade} — {formatarValorPedidoAdmin(
                      Number(item.subtotal),
                      item.tipo_valor === "real" ? "real" : "dzcoins"
                    )}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {tipoPedidos === "finalizados" && pedidoAbertoId === pedido.id && (
                    <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.12)", fontSize: "12px", opacity: 0.8 }}>
                      <div><b>Jogador:</b> {getGamertag(pedido)}</div>
                      <div><b>Tipo:</b> {pedido.tipo === "venda" ? "Venda de ervas" : pedido.tipo === "loja" ? "Compra na Loja" : "Compra de sementes e fertilizantes"}</div>
                      {pedido.tipo === "venda" ? (
                        <div><b>Quantidade:</b> {Number(pedido.ervas_quantidade).toLocaleString("pt-BR")} ervas</div>
                      ) : pedido.tipo === "loja" ? (
                        <div>
                          <b>Itens:</b>
                          {pedido.pedido_itens?.length ? (
                            <div style={{ marginTop: "6px" }}>
                              {pedido.pedido_itens.map((item) => (
                                <div key={item.id}>
                                  {item.nome_produto} × {item.quantidade} — {Number(item.subtotal).toLocaleString("pt-BR")} DZ
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div>Nenhum item registrado.</div>
                          )}
                        </div>
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

      <section className="panel">
        <h2>🏷️ GERENCIADOR DE CATEGORIAS E ITENS</h2>

        <p style={{ marginTop: "4px", opacity: 0.7 }}>
          Gerencie categorias e itens da loja em um único lugar.
        </p>

        {!modoGerenciador ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "8px",
              marginTop: "14px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                limparFormularioCategoria();
                cancelarEdicao();
                setCategoriaSelecionada(null);
                setBuscaProduto("");
                setModoGerenciador("adicionar");
                setTipoGerenciador(null);
              }}
              style={{
                padding: "12px 8px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ➕ ADICIONAR
            </button>

            <button
              type="button"
              onClick={() => {
                limparFormularioCategoria();
                cancelarEdicao();
                setCategoriaSelecionada(null);
                setBuscaProduto("");
                setModoGerenciador("editar");
                setTipoGerenciador(null);
              }}
              style={{
                padding: "12px 8px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ✏️ EDITAR
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                marginTop: "14px",
                marginBottom: "10px",
              }}
            >
              <strong>
                {modoGerenciador === "adicionar"
                  ? "➕ ADICIONAR"
                  : "✏️ EDITAR"}
              </strong>

              <button
                type="button"
                onClick={() => {
                  setModoGerenciador(null);
                  setTipoGerenciador(null);
                  limparFormularioCategoria();
                  cancelarEdicao();
                  setCategoriaSelecionada(null);
                  setBuscaProduto("");
                }}
                style={{
                  padding: "6px 9px",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                ← VOLTAR
              </button>
            </div>

            {!tipoGerenciador ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    limparFormularioCategoria();
                    setCategoriaSelecionada(null);
                    setBuscaProduto("");
                    setTipoGerenciador("categoria");
                  }}
                  style={{
                    padding: "12px 8px",
                    cursor: "pointer",
                  }}
                >
                  📂 CATEGORIA
                </button>

                <button
                  type="button"
                  onClick={() => {
                    cancelarEdicao();
                    setCategoriaSelecionada(null);
                    setBuscaProduto("");
                    setTipoGerenciador("item");
                  }}
                  style={{
                    padding: "12px 8px",
                    cursor: "pointer",
                  }}
                >
                  📦 ITEM
                </button>
              </div>
            ) : tipoGerenciador === "categoria" ? (
              <div
                style={{
                  marginTop: "10px",
                  padding: "12px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <strong>📂 {modoGerenciador === "adicionar" ? "ADICIONAR" : "EDITAR"} CATEGORIA</strong>

                  <button
                    type="button"
                    onClick={() => {
                      setTipoGerenciador(null);
                      limparFormularioCategoria();
                    }}
                    style={{
                      padding: "6px 9px",
                      fontSize: "11px",
                    }}
                  >
                    ← VOLTAR
                  </button>
                </div>

                {modoGerenciador === "editar" && !editandoCategoriaId ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "7px",
                    }}
                  >
                    <input
                      value={buscaCategoria}
                      onChange={(e) => setBuscaCategoria(e.target.value)}
                      placeholder="🔎 Pesquisar categoria"
                    />

                    {buscaCategoria.trim() && (() => {
                      const busca = buscaCategoria.trim().toLowerCase();

                      const resultados = categorias
                        .filter((categoria) =>
                          categoria.nome.toLowerCase().includes(busca) ||
                          categoria.id.toLowerCase().includes(busca)
                        )
                        .sort((a, b) =>
                          a.nome.localeCompare(b.nome, "pt-BR")
                        )
                        .slice(0, 10);

                      if (resultados.length === 0) {
                        return (
                          <p style={{ marginTop: "8px", opacity: 0.7 }}>
                            Nenhuma categoria encontrada.
                          </p>
                        );
                      }

                      return (
                        <div
                          style={{
                            display: "grid",
                            gap: "6px",
                            marginTop: "8px",
                          }}
                        >
                          {resultados.map((categoria) => (
                            <button
                              key={categoria.id}
                              type="button"
                              onClick={() => {
                                setBuscaCategoria("");
                                iniciarEdicaoCategoria(categoria);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "10px",
                                borderRadius: "8px",
                                cursor: "pointer",
                              }}
                            >
                              <strong>
                                {categoria.emoji || "📦"} {categoria.nome}
                              </strong>
                              <span
                                style={{
                                  marginLeft: "6px",
                                  fontSize: "11px",
                                  opacity: 0.65,
                                }}
                              >
                                {categoria.id}
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}

                    <p style={{ fontSize: "11px", opacity: 0.6, margin: 0 }}>
                      Selecione uma categoria para editar.
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gap: "9px",
                      }}
                    >
                      <input
                        value={nomeCategoria}
                        onChange={(e) => setNomeCategoria(e.target.value)}
                        placeholder="Nome da categoria"
                      />

                      <input
                        value={idCategoria}
                        onChange={(e) => setIdCategoria(e.target.value)}
                        placeholder="ID (ex: alimentos)"
                        disabled={editandoCategoriaId !== null}
                      />

                      <input
                        value={emojiCategoria}
                        onChange={(e) => setEmojiCategoria(e.target.value)}
                        placeholder="Emoji"
                      />

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <label style={{ fontSize: "12px", opacity: 0.8 }}>
                          Imagem da categoria
                        </label>

                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const arquivo = e.target.files?.[0] || null;
                            setArquivoImagemCategoria(arquivo);

                            if (arquivo) {
                              setImagemCategoria(
                                URL.createObjectURL(arquivo)
                              );
                            }
                          }}
                        />

                        {imagemCategoria && (
                          <img
                            src={imagemCategoria}
                            alt="Prévia da categoria"
                            style={{
                              width: "100%",
                              maxHeight: "140px",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                          />
                        )}
                      </div>

                      <input
                        value={ordemCategoria}
                        onChange={(e) => setOrdemCategoria(e.target.value)}
                        placeholder="Ordem"
                        type="number"
                        min="0"
                      />

                      <input
                        value={descricaoCategoria}
                        onChange={(e) => setDescricaoCategoria(e.target.value)}
                        placeholder="Descrição da categoria"
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginTop: "12px",
                      }}
                    >
                      {modoGerenciador === "adicionar" ? (
                        <button
                          type="button"
                          onClick={adicionarCategoria}
                          disabled={enviandoImagemCategoria}
                          style={{
                            flex: 1,
                            padding: "10px",
                            fontWeight: "bold",
                          }}
                        >
                          {enviandoImagemCategoria
                            ? "ENVIANDO..."
                            : "➕ CRIAR CATEGORIA"}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={salvarEdicaoCategoria}
                            disabled={enviandoImagemCategoria}
                            style={{
                              flex: 1,
                              padding: "10px",
                              fontWeight: "bold",
                            }}
                          >
                            {enviandoImagemCategoria
                              ? "SALVANDO..."
                              : "💾 SALVAR"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              cancelarEdicaoCategoria();
                              setTipoGerenciador(null);
                            }}
                            style={{
                              padding: "10px",
                            }}
                          >
                            CANCELAR
                          </button>

                          {editandoCategoriaId && (
                            <button
                              type="button"
                              onClick={() => {
                                const categoria = categorias.find(
                                  (item) => item.id === editandoCategoriaId
                                );

                                if (categoria) {
                                  excluirCategoria(categoria);
                                }
                              }}
                              style={{
                                padding: "10px",
                              }}
                            >
                              🗑️ EXCLUIR
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div
                style={{
                  marginTop: "10px",
                  padding: "12px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <strong>
                    📦 {modoGerenciador === "adicionar"
                      ? "ADICIONAR ITEM"
                      : "EDITAR ITEM"}
                  </strong>

                  <button
                    type="button"
                    onClick={() => {
                      setTipoGerenciador(null);
                      cancelarEdicao();
                      setCategoriaSelecionada(null);
                      setBuscaProduto("");
                    }}
                    style={{
                      padding: "6px 9px",
                      fontSize: "11px",
                    }}
                  >
                    ← VOLTAR
                  </button>
                </div>

                {modoGerenciador === "editar" && editandoId === null ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <input
                      value={buscaProduto}
                      onChange={(e) => setBuscaProduto(e.target.value)}
                      placeholder="🔎 Pesquisar item por nome ou ID"
                    />

                    {buscaProduto.trim() && (() => {
                      const busca = buscaProduto.trim().toLowerCase();

                      const resultados = itens
                        .filter((item) =>
                          item.nome.toLowerCase().includes(busca) ||
                          String(item.id).includes(busca)
                        )
                        .sort((a, b) =>
                          a.nome.localeCompare(b.nome, "pt-BR")
                        )
                        .slice(0, 10);

                      if (resultados.length === 0) {
                        return (
                          <p style={{ marginTop: "8px", opacity: 0.7 }}>
                            Nenhum item encontrado.
                          </p>
                        );
                      }

                      return (
                        <div
                          style={{
                            display: "grid",
                            gap: "6px",
                            marginTop: "8px",
                          }}
                        >
                          {resultados.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setCategoriaSelecionada(item.categoria);
                                setBuscaProduto("");
                                iniciarEdicao(item);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "10px",
                                borderRadius: "8px",
                                cursor: "pointer",
                              }}
                            >
                              <strong>{item.nome}</strong>
                              <span
                                style={{
                                  marginLeft: "6px",
                                  fontSize: "11px",
                                  opacity: 0.65,
                                }}
                              >
                                #{item.id} · {obterNomeCategoria(item.categoria)}
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}

                    <p
                      style={{
                        fontSize: "11px",
                        opacity: 0.6,
                        margin: 0,
                      }}
                    >
                      Pesquise pelo nome ou ID e selecione o item para editar.
                    </p>
                  </div>
                ) : (
                  <>
                      <input
                        value={nomeProduto}
                        onChange={(e) => setNomeProduto(e.target.value)}
                        placeholder="Nome do item"
                      />

                      <select
                        value={tipoValorProduto}
                        onChange={(e) => {
                          setTipoValorProduto(e.target.value as TipoValor);
                          setPrecoProduto("");
                        }}
                        style={{
                          width: "100%",
                          padding: "9px",
                        }}
                      >
                        <option value="dzcoins">🪙 DZ Coins</option>
                        <option value="real">💵 Dinheiro (R$)</option>
                      </select>

                      <input
                        value={precoProduto}
                        onChange={(e) => setPrecoProduto(e.target.value)}
                        placeholder={tipoValorProduto === "real" ? "Valor em R$ (ex.: 25,00)" : "Valor em DZ Coins"}
                        type="text"
                        inputMode="decimal"
                      />



                      <select
                        value={categoriaProduto}
                        onChange={(e) => setCategoriaProduto(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "9px",
                        }}
                      >
                        <option value="">Escolha a categoria</option>
                        {categorias.map((categoria) => (
                          <option key={categoria.id} value={categoria.id}>
                            {categoria.emoji || "📦"} {categoria.nome}
                          </option>
                        ))}
                      </select>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginTop: "12px",
                      }}
                    >
                      {modoGerenciador === "adicionar" ? (
                        <button
                          type="button"
                          onClick={adicionarProduto}
                          style={{
                            flex: 1,
                            padding: "10px",
                            fontWeight: "bold",
                          }}
                        >
                          ➕ ADICIONAR ITEM
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={salvarEdicao}
                            style={{
                              flex: 1,
                              padding: "10px",
                              fontWeight: "bold",
                            }}
                          >
                            💾 SALVAR
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const item = itens.find(
                                (produto) => produto.id === editandoId
                              );

                              if (item) {
                                excluirProduto(item);
                              }
                            }}
                            style={{
                              padding: "10px",
                            }}
                          >
                            🗑️ EXCLUIR
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <section className="panel">
        <button
          type="button"
          onClick={() => {
            setGerenciandoPosicoes((atual) => !atual);
            setCategoriaPosicoesSelecionada(null);
            setCategoriaSelecionada(null);
            setBuscaProduto("");
          }}
          style={{
            width: "100%",
            padding: "13px",
            fontWeight: "bold",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          ⚙️ GERENCIAR POSIÇÕES
        </button>

        {gerenciandoPosicoes && (
          <div style={{ marginTop: "12px" }}>
            {!categoriaPosicoesSelecionada ? (
              <>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: "12px",
                    opacity: 0.7,
                  }}
                >
                  Escolha uma categoria para organizar a posição dos itens.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "8px",
                  }}
                >
                  {categorias.map((categoria) => {
                    const quantidade = itens.filter(
                      (item) => item.categoria === categoria.id
                    ).length;

                    return (
                      <button
                        key={categoria.id}
                        type="button"
                        onClick={() => {
                          setCategoriaPosicoesSelecionada(categoria.id);
                          setCategoriaSelecionada(categoria.id);
                          setBuscaProduto("");
                        }}
                        style={{
                          padding: "12px 10px",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <strong>
                          {categoria.emoji || "📦"} {categoria.nome}
                        </strong>

                        <div
                          style={{
                            fontSize: "11px",
                            opacity: 0.65,
                            marginTop: "4px",
                          }}
                        >
                          {quantidade}{" "}
                          {quantidade === 1 ? "item" : "itens"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {(() => {
                  const categoriaAtual = categorias.find(
                    (categoria) =>
                      categoria.id === categoriaPosicoesSelecionada
                  );

                  const itensDaCategoria = itens
                    .filter(
                      (item) =>
                        item.categoria === categoriaPosicoesSelecionada
                    )
                    .sort((a, b) => {
                      const ordemA = Number(a.ordem ?? 0);
                      const ordemB = Number(b.ordem ?? 0);

                      return ordemA - ordemB || a.id - b.id;
                    });

                  return (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                          marginBottom: "12px",
                        }}
                      >
                        <strong>
                          {categoriaAtual?.emoji || "📦"}{" "}
                          {categoriaAtual?.nome || "Categoria"}
                        </strong>

                        <span
                          style={{
                            fontSize: "11px",
                            opacity: 0.65,
                          }}
                        >
                          {itensDaCategoria.length}{" "}
                          {itensDaCategoria.length === 1
                            ? "item"
                            : "itens"}
                        </span>
                      </div>

                      {itensDaCategoria.length === 0 ? (
                        <p
                          style={{
                            margin: "0 0 12px",
                            fontSize: "12px",
                            opacity: 0.65,
                          }}
                        >
                          Esta categoria não possui itens.
                        </p>
                      ) : (
                        <div
                          style={{
                            display: "grid",
                            gap: "7px",
                          }}
                        >
                          {itensDaCategoria.map((item, index) => (
                            <div
                              key={item.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "9px",
                                borderRadius: "8px",
                              }}
                            >
                              <strong
                                style={{
                                  minWidth: "28px",
                                  textAlign: "center",
                                  fontSize: "13px",
                                }}
                              >
                                {index + 1}
                              </strong>

                              <div
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {item.nome}
                                </div>

                                <div
                                  style={{
                                    fontSize: "10px",
                                    opacity: 0.55,
                                    marginTop: "2px",
                                  }}
                                >
                                  ID: {item.id}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  moverItem(item.id, "cima")
                                }
                                disabled={index === 0 || salvandoOrdem}
                                title="Mover para cima"
                                style={{
                                  padding: "6px 8px",
                                  cursor:
                                    index === 0 || salvandoOrdem
                                      ? "default"
                                      : "pointer",
                                  opacity:
                                    index === 0 || salvandoOrdem
                                      ? 0.35
                                      : 1,
                                }}
                              >
                                ⬆️
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  moverItem(item.id, "baixo")
                                }
                                disabled={
                                  index === itensDaCategoria.length - 1 ||
                                  salvandoOrdem
                                }
                                title="Mover para baixo"
                                style={{
                                  padding: "6px 8px",
                                  cursor:
                                    index === itensDaCategoria.length - 1 ||
                                    salvandoOrdem
                                      ? "default"
                                      : "pointer",
                                  opacity:
                                    index === itensDaCategoria.length - 1 ||
                                    salvandoOrdem
                                      ? 0.35
                                      : 1,
                                }}
                              >
                                ⬇️
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setCategoriaPosicoesSelecionada(null);
                          setCategoriaSelecionada(null);
                          setBuscaProduto("");
                        }}
                        style={{
                          width: "100%",
                          marginTop: "12px",
                          padding: "10px",
                          cursor: "pointer",
                        }}
                      >
                        ← VOLTAR ÀS CATEGORIAS
                      </button>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        )}

      </section>

    </main>  );
}
