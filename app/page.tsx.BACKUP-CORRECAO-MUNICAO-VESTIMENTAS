 "use client";
import { supabase } from "../lib/supabase";
import {useEffect,useMemo,useState} from "react";

const HERB_PRICE=15000/50, SEED_PACK_PRICE=2000/4, FERT_PRICE=2500;

export default function Home(){
 const [lojaAberta,setLojaAberta]=useState(false);
 const [categoriaLoja,setCategoriaLoja]=useState<string|null>(null);
 const [itensLoja,setItensLoja]=useState<any[]>([]);
 const [carregandoLoja,setCarregandoLoja]=useState(false);
 const [erroLoja,setErroLoja]=useState("");
 const [pesquisaLoja,setPesquisaLoja]=useState("");
 type CarrinhoItem = {
  id: number;
  nome: string;
  categoria: string;
  valor: number;
  quantidade: number;
 };

 const [carrinho,setCarrinho]=useState<CarrinhoItem[]>([]);
 const [carrinhoAberto,setCarrinhoAberto]=useState(false);
 const [enviandoCarrinho,setEnviandoCarrinho]=useState(false);


 const categoriasLoja = [
   { id:"veiculos", image:"/loja/01-veiculos.jpg", title:"VEÍCULOS", text:"Veículos disponíveis para compra" },
   { id:"construcao", image:"/loja/02-construcao.jpg", title:"CONSTRUÇÃO", text:"Materiais e itens para construção" },
   { id:"armas-brancas", image:"/loja/03-armas-brancas.jpg", title:"ARMAS BRANCAS", text:"Equipamentos e lâminas disponíveis" },
   { id:"armas", image:"/loja/04-armas.jpg", title:"ARMAS", text:"Equipamentos disponíveis para compra" },
   { id:"explosivos", image:"/loja/05-explosivos.jpg", title:"EXPLOSIVOS", text:"Materiais explosivos disponíveis" },
   { id:"municao", image:"/loja/06-municao.jpg", title:"MUNIÇÃO", text:"Munições disponíveis para compra" },
   { id:"vestuario", image:"/loja/07-vestuario.jpg", title:"VESTUÁRIO", text:"Roupas e trajes disponíveis" },
   { id:"pecas", image:"/loja/08-pecas.jpg", title:"PEÇAS", text:"Peças e componentes para veículos" },
   { id:"especiais", image:"/loja/09-itens-exclusivos.jpg", title:"ITENS EXCLUSIVOS", text:"Itens especiais disponíveis por tempo limitado" },
 ];
 const [mode,setMode]=useState<"home"|"sell"|"buy"|"orders"|"ranking">("home");
 const [gamertag,setGamertag]=useState(""); const [herbs,setHerbs]=useState(50);
 const [seeds,setSeeds]=useState(0); const [fert,setFert]=useState(0);
 const [notice,setNotice]=useState("");
 const herbValue=Math.max(0,herbs)*HERB_PRICE;
 const buyValue=seeds*SEED_PACK_PRICE+fert*FERT_PRICE;
 const [orders,setOrders]=useState<any[]>([]);
  const [ranking,setRanking]=useState<any[]>([]);
  useEffect(()=>{(async()=>{const {data}=await supabase.rpc("ranking_vendas");if(data)setRanking(data);})();},[]);


 function adicionarAoCarrinho(item:any){
  setCarrinho(prev => {
   const existente = prev.find(p => p.id === item.id);

   if(existente){
    return prev.map(p =>
     p.id === item.id
      ? { ...p, quantidade: p.quantidade + 1 }
      : p
    );
   }

   return [
    ...prev,
    {
     id: item.id,
     nome: item.nome,
     categoria: item.categoria,
     valor: Number(item.valor),
     quantidade: 1
    }
   ];
  });

  setNotice(`${item.nome} adicionado ao carrinho.`);
 }

 function atualizarQuantidade(id:number, valor:string){
  const quantidade = Math.max(1, Number(valor) || 1);

  setCarrinho(prev =>
   prev.map(item =>
    item.id === id
     ? { ...item, quantidade }
     : item
   )
  );
 }

 function removerDoCarrinho(id:number){
  setCarrinho(prev =>
   prev.filter(item => item.id !== id)
  );
 }

 const totalCarrinho = carrinho.reduce(
  (total,item) =>
   total + item.valor * item.quantidade,
  0
 );

 const quantidadeItensCarrinho = carrinho.reduce(
  (total,item) =>
   total + item.quantidade,
  0
 );

 async function enviarCarrinho(){
  if(carrinho.length===0){
   return setNotice("Adicione pelo menos um produto ao carrinho.");
  }

  if(!gamertag.trim()){
   return setNotice("Informe sua Gamertag.");
  }

  setEnviandoCarrinho(true);
  setNotice("Enviando pedido...");

  try{
   const {data:playerData,error:playerError}=await supabase.rpc("obter_ou_criar_jogador",{
    p_gamertag:gamertag.trim()
   });

   if(playerError || !playerData?.[0]){
    console.error(playerError);
    setNotice(playerError?.message || "Não foi possível identificar o jogador.");
    return;
   }

   const player=playerData[0];

   const {data:pedido,error:pedidoError}=await supabase
    .from("pedidos")
    .insert({
     jogador_id:player.id,
     tipo:"loja",
     ervas_quantidade:0,
     sementes_pacotes:0,
     fertilizante_quantidade:0,
     valor_total:totalCarrinho,
     status:"processando"
    })
    .select("id")
    .single();

   if(pedidoError || !pedido){
    setNotice(pedidoError?.message || "Não foi possível registrar o pedido.");
    return;
   }

   const linhas=carrinho.map(item=>({
    pedido_id:pedido.id,
    produto_id:item.id,
    nome_produto:item.nome,
    quantidade:item.quantidade,
    valor_unitario:item.valor,
    subtotal:item.valor*item.quantidade
   }));

   const {error:itensError}=await supabase
    .from("pedido_itens")
    .insert(linhas);

   if(itensError){
    await supabase.from("pedidos").delete().eq("id",pedido.id);
    setNotice(`Erro ao registrar os produtos do pedido: ${itensError.message}`);
    return;
   }

   try{
    const notificationResponse=await fetch("/api/notificar-pedido-loja",{
     method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({
      id:pedido.id,
      gamertag:gamertag.trim(),
      items:carrinho,
      total:totalCarrinho
     })
    });

    if(!notificationResponse.ok){
     console.error("Não foi possível enviar a notificação por e-mail da Loja.");
    }
   }catch(error){
    console.error("Erro ao chamar a notificação por e-mail da Loja:",error);
   }

   setCarrinho([]);
   setCarrinhoAberto(false);
   setLojaAberta(false);
   setCategoriaLoja(null);
   setMode("home");
   setNotice(`Pedido #${pedido.id} enviado com sucesso.`);
  }catch(error){
   console.error("Erro ao enviar pedido da Loja:",error);
   setNotice("Erro ao enviar pedido. Tente novamente.");
  }finally{
   setEnviandoCarrinho(false);
  }
 }

 async function abrirCategoriaLoja(categoria:string){
   setCategoriaLoja(categoria);
   setPesquisaLoja("");
   setItensLoja([]);
   setErroLoja("");
   setCarregandoLoja(true);

   const { data, error } = await supabase
     .from("itens")
     .select("id, nome, categoria, valor")
     .eq("categoria", categoria)
     .order("id", { ascending:true });

   if(error){
     console.error("Erro ao carregar produtos da Loja:", error);
     setErroLoja("Não foi possível carregar os produtos desta categoria.");
     setItensLoja([]);
   }else{
     setItensLoja(data || []);
   }

   setCarregandoLoja(false);
 }

 function fecharLoja(){
   setLojaAberta(false);
   setCategoriaLoja(null);
   setItensLoja([]);
   setPesquisaLoja("");
   setErroLoja("");
 }
 async function submit(type:"venda"|"compra"){
   if(!gamertag.trim()) return setNotice("Informe sua Gamertag.");
   if(type==="venda" && herbs<=0) return setNotice("Informe a quantidade de ervas.");
   if(type==="compra" && seeds===0 && fert===0) return setNotice("Escolha sementes, fertilizante ou os dois.");

   setNotice("Enviando pedido...");

   const { data: playerData, error: playerError } = await supabase
    .rpc("obter_ou_criar_jogador", {
      p_gamertag: gamertag.trim(),
    });

   if (playerError || !playerData?.[0]) {
     console.error(playerError);
     return setNotice("Não foi possível cadastrar ou identificar o jogador.");
   }

   const player = playerData[0];

   const { error: orderError } = await supabase.from("pedidos").insert({
     jogador_id: player.id,
     tipo: type,
     ervas_quantidade: type === "venda" ? herbs : 0,
     sementes_pacotes: type === "compra" ? seeds : 0,
     fertilizante_quantidade: type === "compra" ? fert : 0,
     valor_total: type === "venda" ? herbValue : buyValue,
     status: "processando"
   });

   if (orderError) {
     return setNotice(`Erro Supabase: ${orderError.message}`);
   }

   const localOrder = {
     id: Date.now(),
     gamertag: gamertag.trim(),
     type,
     herbs: type === "venda" ? herbs : 0,
     seeds: type === "compra" ? seeds : 0,
     fert: type === "compra" ? fert : 0,
     total: type === "venda" ? herbValue : buyValue,
     status: "processando"
   };

   setOrders(prev => [localOrder, ...prev]);

   try {
     const notificationResponse = await fetch("/api/notificar-pedido", {
       method: "POST",
       headers: {
         "Content-Type": "application/json"
       },
       body: JSON.stringify(localOrder)
     });

     if (!notificationResponse.ok) {
       console.error("Não foi possível enviar a notificação por e-mail.");
     }
   } catch (error) {
     console.error("Erro ao chamar a notificação por e-mail:", error);
   }

   setNotice(`Pedido #${localOrder.id} enviado com sucesso.`);
   setMode("home");
 }

 return <main>
  <header className="hero"><div className="shade"/><div className="heroText"><small>SERVIDOR</small><h1>HOLOCAUSTO&nbsp;Z</h1><div className="logo">DISTRITO <b>ZERO</b></div><strong>COMÉRCIO & CULTIVO</strong><em>A ÚLTIMA ESPERANÇA AINDA BROTA.</em><div className="hero-admin"><button className="admin-link" onClick={()=>window.location.href="/administracao/login"}>🔒 Mercador</button></div></div></header>
  <nav className="mainActions">

  <button className="actionCard actionHerbs" onClick={() => {setMode("sell");setNotice("")}}>
    <div className="actionVisual">
      <div className="visualCircle">🌿</div>
      <span className="visualLine"></span>
    </div>
    <div className="actionTitle">ERVAS</div>
    <small>Vender colheita</small>
    <b>ENTRAR →</b>
  </button>

  <button className="actionCard actionSupplies" onClick={() => {setMode("buy");setNotice("")}}>
    <div className="actionVisual">
      <div className="visualCircle">📦</div>
      <span className="visualLine"></span>
    </div>
    <div className="actionTitle">SUPRIMENTOS</div>
    <small>Sementes e fertilizante</small>
    <b>ENTRAR →</b>
  </button>

  <button className="actionCard actionRanking" onClick={() => {setMode("ranking");setNotice("")}}>
    <div className="actionVisual">
      <div className="visualCircle">🏆</div>
      <span className="visualLine"></span>
    </div>
    <div className="actionTitle">TOP 10</div>
    <small>Ranking semanal</small>
    <b>ENTRAR →</b>
  </button>

  <button className="actionCard actionStore" onClick={() => {setLojaAberta(true);setCategoriaLoja(null);setPesquisaLoja("");setNotice("")}}>
    <div className="actionVisual">
      <div className="visualCircle">🛒</div>
      <span className="visualLine"></span>
    </div>
    <div className="actionTitle">LOJA</div>
    <small>Itens para sobrevivência</small>
    <b>ENTRAR →</b>
  </button>

</nav>
  <div className="wrap">{notice&&<div className="notice">{notice}</div>}
   {mode!=="home"&&<button className="backHome" onClick={()=>{setMode("home");setNotice("")}}>← INÍCIO</button>}
   {mode==="home"&&!lojaAberta&&<>
<section className="guide">
  <div className="guideIntro">
    <h2>GUIA DO DISTRITO ZERO</h2>
    <p>
      Informações, valores e orientações para os jogadores do
      <strong> DayZ no Xbox e PlayStation</strong>.
    </p>
  </div>

  <div className="guideCard">
    <h3>🌱 COMO PLANTAR</h3>
    <p>
      O processo de plantação no servidor segue um ciclo simples:
    </p>

    <div className="plantCycle">
      <span>🌱 SEMENTE</span>
      <b>→</b>
      <span>🧪 FERTILIZANTE <small>(OPCIONAL)</small></span>
      <b>→</b>
      <span>💧 ÁGUA</span>
      <b>→</b>
      <span>🌿 CRESCIMENTO</span>
      <b>→</b>
      <span>🌿 COLHEITA</span>
      <b>→</b>
      <span>🪓 REMOVER</span>
      <b>→</b>
      <span>🔄 NOVA PLANTAÇÃO</span>
    </div>

    <p>
      O fertilizante é opcional. Mesmo sem fertilizante, é possível
      realizar a plantação. Depois de plantar, aguarde o crescimento
      e o desenvolvimento da planta.
    </p>

    <p>
      Quando a planta estiver desenvolvida e produzir os frutos,
      faça a colheita. Depois, retire o pé que ficou sem frutos e
      prepare o local para uma nova plantação.
    </p>
  </div>

  <div className="guideCard">
    <h3>💰 VALORES DO DISTRITO ZERO</h3>

    <div className="guidePrice">
      <span>🌿 Ervas Medicinais</span>
      <strong>50 unidades — 15.000 DZ</strong>
    </div>

    <div className="guidePrice">
      <span>🌱 Sementes</span>
      <strong>4 pacotinhos — 2.000 DZ</strong>
    </div>

    <div className="guidePrice">
      <span>🧪 Fertilizante</span>
      <strong>1 unidade — 2.500 DZ</strong>
    </div>
  </div>

  <div className="guideCard">
    <h3>📜 REGRAS DA NEGOCIAÇÃO</h3>
    <p>🤝 Negociações devem ser realizadas dentro do servidor.</p>
    <p>📍 Siga as orientações do Distrito Zero para a entrega.</p>
    <p>🎮 As informações deste guia são destinadas aos jogadores de console.</p>
    <p>🚫 Procedimentos específicos da versão PC não fazem parte deste guia.</p>
  </div>

  <div className="guideCard consoleNotice">
    <h3>🎮 CONSOLE</h3>
    <p>
      Este guia foi preparado para <strong>DayZ no Xbox e PlayStation</strong>.
      Controles e procedimentos podem ser diferentes na versão para PC.
    </p>
  </div>
</section>
</>}
{lojaAberta&&
<section className="lojaHome">

  <div className="lojaHomeHeader">
    <div>
      <h2>🛒 LOJA DISTRITO ZERO</h2>
      <p>Itens disponíveis para compra em DZ Coins.</p>
    </div>
    <button className="lojaCartButton" type="button" onClick={() => setCarrinhoAberto(true)}>🛒 CARRINHO ({quantidadeItensCarrinho})</button>

    <div className="lojaCloseWrap"><button className="lojaClose" onClick={fecharLoja}>✕ FECHAR</button></div>
  </div>

  {!categoriaLoja ? (
    <div className="lojaCategoryGrid">
      {categoriasLoja.map((categoria) => (
        <button
          className="lojaCategoryCard"
          key={categoria.id}
          onClick={() => abrirCategoriaLoja(categoria.id)}
        >
          <img src={categoria.image} alt={categoria.title} />
          <div className="lojaCategoryOverlay">
            <h3>{categoria.title}</h3>
            <p>{categoria.text}</p>
            <b>VER ITENS →</b>
          </div>
        </button>
      ))}
    </div>
  ) : (
    <>
      {(() => {
        const categoriaAtual = categoriasLoja.find((categoria) => categoria.id === categoriaLoja);
        const produtosFiltrados = itensLoja.filter((item) =>
          String(item.nome || "").toLowerCase().includes(pesquisaLoja.toLowerCase())
        );

        return (
          <>
            <div className="lojaProductsHeader">
              <div>
                <button
                  className="lojaBackCategories"
                  onClick={() => {
                    setCategoriaLoja(null);
                    setItensLoja([]);
                    setPesquisaLoja("");
                    setErroLoja("");
                  }}
                >
                  ← CATEGORIAS
                </button>
                <h2>{categoriaAtual?.title || categoriaLoja}</h2>
                <p>{categoriaAtual?.text || "Itens disponíveis nesta categoria."}</p>
              </div>

              <input
                className="lojaSearch"
                type="text"
                placeholder="Pesquisar produto..."
                value={pesquisaLoja}
                onChange={(e) => setPesquisaLoja(e.target.value)}
              />
            </div>

            {carregandoLoja && <div className="lojaStatus">CARREGANDO PRODUTOS...</div>}

            {erroLoja && <div className="lojaStatus lojaError">{erroLoja}</div>}

            {!carregandoLoja && !erroLoja && produtosFiltrados.length === 0 && (
              <div className="lojaStatus">
                {pesquisaLoja
                  ? "Nenhum produto encontrado para esta pesquisa."
                  : "Nenhum produto cadastrado nesta categoria ainda."}
              </div>
            )}

            {!carregandoLoja && !erroLoja && produtosFiltrados.length > 0 && (
              <div className="lojaProductsGrid" style={{ display: "flex", flexDirection: "column", gap: "7px", marginTop: "12px" }}>
                {produtosFiltrados.map((item) => (
                  <div className="lojaProductCard" key={item.id} onClick={() => adicionarAoCarrinho(item)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); adicionarAoCarrinho(item); } }} style={{ display: "flex", alignItems: "center", gap: "9px", padding: "7px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "9px", boxShadow: "0 2px 6px rgba(0,0,0,0.22)" }}>
                    <div className="lojaProductIcon">📦</div>
                    <div className="lojaProductInfo">
                      <h3>{item.nome}</h3>
                      <small>ID #{item.id}</small>
                    </div>
                    <strong>
                      {Number(item.valor).toLocaleString("pt-BR")} DZ Coins
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      })()}
    </>
  )}


  {carrinhoAberto && (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", padding: "16px", overflowY: "auto" }}>
      <div style={{ maxWidth: "520px", margin: "30px auto", background: "#111", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "12px", padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h2 style={{ margin: 0 }}>🛒 CARRINHO</h2>
          <button type="button" onClick={() => setCarrinhoAberto(false)}>✕</button>
        </div>

        {carrinho.length === 0 ? (
          <p>Seu carrinho está vazio.</p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {carrinho.map((item) => (
                <div key={item.id} style={{ padding: "10px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "9px" }}>
                  <div style={{ fontWeight: 700 }}>{item.nome}</div>
                  <div style={{ fontSize: "13px", opacity: 0.75 }}>{Number(item.valor).toLocaleString("pt-BR")} DZ Coins cada</div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={item.quantidade}
                      onChange={(e) => atualizarQuantidade(item.id, e.target.value)}
                      style={{ width: "70px", padding: "7px", borderRadius: "7px", border: "1px solid rgba(255,255,255,0.2)" }}
                    />

                    <span style={{ flex: 1 }}>
                      {(item.valor * item.quantidade).toLocaleString("pt-BR")} DZ Coins
                    </span>

                    <button type="button" onClick={() => removerDoCarrinho(item.id)}>REMOVER</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.15)", fontWeight: 700 }}>
              TOTAL: {totalCarrinho.toLocaleString("pt-BR")} DZ Coins
            </div>

            <label style={{ display: "block", marginTop: "14px" }}>
              Gamertag
              <input
                value={gamertag}
                onChange={(e) => setGamertag(e.target.value)}
                placeholder="Nome no jogo"
                style={{ display: "block", width: "100%", marginTop: "5px", padding: "9px", boxSizing: "border-box" }}
              />
            </label>

            <button
              type="button"
              onClick={enviarCarrinho}
              disabled={enviandoCarrinho}
              style={{ width: "100%", marginTop: "14px", padding: "11px", fontWeight: 700 }}
            >
              {enviandoCarrinho ? "ENVIANDO..." : "ENVIAR PEDIDO"}
            </button>
          </>
        )}
      </div>
    </div>
  )}
</section>
}

{mode==="ranking"&&
<Panel title="🏆 RANKING DOS VENDEDORES">

  <div className="ranking-intro">
    <span>⚔️</span>
    <div>
      <strong>DISPUTA PELO TOPO</strong>
      <p>Ranking acumulado desde o início. Cada venda pode mudar a classificação.</p>
    </div>
  </div>




  {ranking[0]&&
    <div className="rank-champion">

      <div className="rank-crown">👑</div>

      <div className="rank-label">CAMPEÃO ATUAL</div>

      <div className="rank-champion-name">
        {ranking[0].gamertag}
      </div>

      <div className="rank-stats">

        <div>
          <small>🌿 UNIDADES VENDIDAS</small>
          <strong>
            {Number(ranking[0].quantidade_ervas).toLocaleString("pt-BR")} ervas
          </strong>
        </div>

        <div>
          <small>💰 TOTAL ARRECADADO</small>
          <strong>
            {Number(ranking[0].valor_arrecadado).toLocaleString("pt-BR")} DZCOINS
          </strong>
        </div>

      </div>

      <div className="rank-champion-badge">
        🥇 1º LUGAR
      </div>

    </div>
  }

  <div className="rank-podium">

    {[1,2].map(position => {
      const x = ranking[position];
      const medal = position === 1 ? "🥈" : "🥉";

      return (
        <div
          className={`rank-podium-card rank-position-${position + 1}`}
          key={position}
        >

          <div className="rank-medal">{medal}</div>

          <div className="rank-number">{position + 1}º</div>

          <strong className="rank-name">
            {x?.gamertag || "LUGAR DISPONÍVEL"}
          </strong>

          <span className="rank-unit">
            {x
              ? `${Number(x.quantidade_ervas).toLocaleString("pt-BR")} ervas`
              : "Seja o próximo a conquistar este lugar"}
          </span>

          {x&&
            <span className="rank-money">
              💰 {Number(x.valor_arrecadado).toLocaleString("pt-BR")} DZCOINS
            </span>
          }

        </div>
      );
    })}

  </div>

  <div className="rank-list">

    {Array.from({length:7},(_,i) => {

      const position = i + 3;
      const x = ranking[position];

      return (
        <div
          className={`rank-entry ${!x ? "rank-empty" : ""}`}
          key={position}
        >

          <div className="rank-entry-position">
            <b>{position + 1}º</b>
          </div>

          <div className="rank-entry-player">
            <strong>{x?.gamertag || "LUGAR DISPONÍVEL"}</strong>

            <small>
              {x
                ? `${Number(x.quantidade_ervas).toLocaleString("pt-BR")} ervas`
                : "Ainda disponível"}
            </small>
          </div>

          <div className="rank-entry-money">
            {x
              ? `${Number(x.valor_arrecadado).toLocaleString("pt-BR")} DZCOINS`
              : "—"}
          </div>

        </div>
      );
    })}

  </div>

  <div className="ranking-footer">
    <span>🔥</span>
    <strong>VENDA MAIS. SUBA MAIS.</strong>
    <small>O próximo nome no topo pode ser o seu.</small>
  </div>

</Panel>}
   {mode==="sell"&&<Panel title="🌿 VENDER ERVAS">
<label>
Gametag
<input
value={gamertag}
onChange={e=>setGamertag(e.target.value)}
placeholder="Nome no jogo"
/>
</label>

<div className="product">
<span>🌿 Ervas Medicinais</span>
<small>1 unidade = 300 DZ</small>

<div className="counter">
<input type="number" min="0" inputMode="numeric" value={herbs || ""} onChange={e=>setHerbs(Math.max(0, Number(e.target.value)))} />
</div>
</div>

<div className="total">
Total a receber:
<strong>{herbValue.toLocaleString("pt-BR")} DZ Coins</strong>
</div>

<button className="action" onClick={()=>submit("venda")}>
AGENDAR VENDA
</button>
</Panel>}

{mode==="buy"&&<Panel title="🛒 COMPRAR SUPRIMENTOS"><label>Gamertag<input value={gamertag} onChange={e=>setGamertag(e.target.value)} placeholder="Nome no jogo"/></label><div className="product"><span>🌱 Sementes <small>4 pacotinhos = 2.000 DZ</small></span><div><input type="number" min="0" inputMode="numeric" value={seeds || ""} onChange={e=>setSeeds(Math.max(0, Number(e.target.value)))} /></div></div><div className="product"><span>🧪 Fertilizante <small>1 unidade = 2.500 DZ</small></span><div><input type="number" min="0" inputMode="numeric" value={fert || ""} onChange={e=>setFert(Math.max(0, Number(e.target.value)))} /></div></div><div className="total">Total<strong>{buyValue.toLocaleString("pt-BR")} DZ Coins</strong></div><button className="action" onClick={()=>submit("compra")}>AGENDAR COMPRA</button></Panel>}
  </div><footer>DISTRITO ZERO • HOLOCAUSTO • <small>PRODUZA. VENDA. FORTALEÇA O SERVIDOR.</small></footer>
 </main>
}
function Card(p:any){return <button className="card" onClick={p.onClick}><span>{p.icon}</span><h3>{p.title}</h3><p>{p.text}</p><b>ACESSAR →</b></button>}
function Price(p:any){return <div><b>{p.title}</b><span>{p.detail}</span><strong>{p.value}</strong></div>}
function Panel(p:any){return <section className="panel"><h2>{p.title}</h2>{p.children}</section>}