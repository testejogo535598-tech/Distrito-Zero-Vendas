 "use client";
import { supabase } from "../lib/supabase";
import {useEffect,useMemo,useState} from "react";

const HERB_PRICE=15000/50, SEED_PACK_PRICE=2000/4, FERT_PRICE=2500;

export default function Home(){
 const [mode,setMode]=useState<"home"|"sell"|"buy"|"orders"|"ranking">("home");
 const [gamertag,setGamertag]=useState(""); const [herbs,setHerbs]=useState(50);
 const [seeds,setSeeds]=useState(0); const [fert,setFert]=useState(0);
 const [notice,setNotice]=useState("");
 const herbValue=Math.max(0,herbs)*HERB_PRICE;
 const buyValue=seeds*SEED_PACK_PRICE+fert*FERT_PRICE;
 const [orders,setOrders]=useState<any[]>([]);
  const [ranking,setRanking]=useState<any[]>([]);
  useEffect(()=>{(async()=>{const {data}=await supabase.rpc("ranking_vendas");if(data)setRanking(data);})();},[]);

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
   const { data: order, error: orderError } = await supabase.from("pedidos").insert({
     jogador_id: player.id,
     tipo: type,
     ervas_quantidade: type === "venda" ? herbs : 0,
     sementes_pacotes: type === "compra" ? seeds : 0,
     fertilizante_quantidade: type === "compra" ? fert : 0,
     valor_total: type === "venda" ? herbValue : buyValue,
     status: "processando"
   });
   if (orderError) return setNotice(`Erro Supabase: ${orderError.message}`);
   const localOrder = { id: Date.now(), gamertag: gamertag.trim(), type, herbs: type === "venda" ? herbs : 0, seeds: type === "compra" ? seeds : 0, fert: type === "compra" ? fert : 0, total: type === "venda" ? herbValue : buyValue, status: "processando" };
   setOrders(prev => [localOrder, ...prev]);
   setNotice(`Pedido #${Date.now()} enviado com sucesso.`); setMode("home");
 }
 return <main>
  <header className="hero"><div className="shade"/><div className="heroText"><small>SERVIDOR</small><h1>HOLOCAUSTO</h1><div className="logo">DISTRITO <b>ZERO</b></div><strong>COMÉRCIO & CULTIVO</strong><em>A ÚLTIMA ESPERANÇA AINDA BROTA.</em><div className="hero-admin"><button className="admin-link" onClick={()=>window.location.href="/administracao/login"}>🔒 Admin</button></div></div></header>
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

</nav>
  <div className="wrap">{notice&&<div className="notice">{notice}</div>}
   {mode!=="home"&&<button className="backHome" onClick={()=>{setMode("home");setNotice("")}}>← INÍCIO</button>}
   {mode==="home"&&<>
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
<button onClick={()=>setHerbs(Math.max(0, herbs-1))}>−</button>
<b>{herbs}</b>
<button onClick={()=>setHerbs(herbs+1)}>+</button>
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

{mode==="buy"&&<Panel title="🛒 COMPRAR SUPRIMENTOS"><label>Gamertag<input value={gamertag} onChange={e=>setGamertag(e.target.value)} placeholder="Nome no jogo"/></label><div className="product"><span>🌱 Sementes <small>4 pacotinhos = 2.000 DZ</small></span><div><button onClick={()=>setSeeds(Math.max(0,seeds-1))}>−</button><b>{seeds}</b><button onClick={()=>setSeeds(seeds+1)}>+</button></div></div><div className="product"><span>🧪 Fertilizante <small>1 unidade = 2.500 DZ</small></span><div><button onClick={()=>setFert(Math.max(0,fert-1))}>−</button><b>{fert}</b><button onClick={()=>setFert(fert+1)}>+</button></div></div><div className="total">Total<strong>{buyValue.toLocaleString("pt-BR")} DZ Coins</strong></div><button className="action" onClick={()=>submit("compra")}>AGENDAR COMPRA</button></Panel>}
  </div><footer>DISTRITO ZERO • HOLOCAUSTO • <small>PRODUZA. VENDA. FORTALEÇA O SERVIDOR.</small></footer>
 </main>
}
function Card(p:any){return <button className="card" onClick={p.onClick}><span>{p.icon}</span><h3>{p.title}</h3><p>{p.text}</p><b>ACESSAR →</b></button>}
function Price(p:any){return <div><b>{p.title}</b><span>{p.detail}</span><strong>{p.value}</strong></div>}
function Panel(p:any){return <section className="panel"><h2>{p.title}</h2>{p.children}</section>}