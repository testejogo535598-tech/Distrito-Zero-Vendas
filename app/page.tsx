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
  useEffect(()=>{(async()=>{const {data}=await supabase.rpc("ranking_semanal");if(data)setRanking(data);})();},[]);

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
   }).select("*").single();
   if (orderError) return setNotice("Não foi possível criar o pedido.");
   const localOrder = { id: order.id, gamertag: gamertag.trim(), type, herbs: type === "venda" ? herbs : 0, seeds: type === "compra" ? seeds : 0, fert: type === "compra" ? fert : 0, total: type === "venda" ? herbValue : buyValue, status: "processando" };
   setOrders(prev => [localOrder, ...prev]);
   setNotice(`Pedido #${order.id} enviado com sucesso.`); setMode("home");
 }
 return <main>
  <header className="hero"><div className="shade"/><div className="heroText"><small>SERVIDOR</small><h1>HOLOCAUSTO <i>Z</i></h1><p>O CAOS MOVE. A ESTRATÉGIA VENCE.</p><div className="logo">DISTRITO <b>ZERO</b></div><strong>COMÉRCIO & SUPRIMENTOS</strong><em>NEGOCIE. PLANTE. FORTALEÇA O SERVIDOR.</em></div></header>
  <nav>{[["home","Início"],["sell","🌿 Vender Ervas"],["buy","🛒 Comprar Suprimentos"],["ranking","🏆 Top 10 da Semana"]].map(([id,label])=><button key={id} onClick={()=>{setMode(id as any);setNotice("")}}>{label}</button>)}</nav>
  <div className="wrap">{notice&&<div className="notice">{notice}</div>}
   {mode==="home"&&<><section className="intro"><h2>CENTRAL DE COMÉRCIO</h2><p>Agende sua venda de ervas ou sua compra de sementes e fertilizantes. A negociação é realizada dentro do jogo.</p></section><div className="cards"><Card icon="🌿" title="Vender Ervas" text="Informe a quantidade e agende sua venda." onClick={()=>setMode("sell")}/><Card icon="🛒" title="Comprar Suprimentos" text="Escolha sementes, fertilizante ou os dois em um único pedido." onClick={()=>setMode("buy")}/><Card icon="🏆" title="Top 10 da Semana" text="Veja os dez maiores vendedores da semana." onClick={()=>setMode("ranking")}/></div><div className="prices"><Price title="Ervas Medicinais" detail="50 unidades" value="15.000 DZ"/><Price title="Sementes" detail="4 pacotinhos" value="2.000 DZ"/><Price title="Fertilizante" detail="1 unidade" value="2.500 DZ"/></div></>}
        {mode==="ranking"&&<Panel title="🏆 TOP 10 DA SEMANA"><p className="muted">Ranking atualizado automaticamente pelas vendas realizadas durante a semana.</p>{Array.from({length:10},(_,i)=>ranking[i]||{gamertag:"VAGO",quantidade_ervas:0}).map((x,i)=><div className="rank" key={i}><b>{i+1}º</b><span>{x.gamertag}</span>{x.quantidade_ervas>0&&<strong>{Number(x.quantidade_ervas).toLocaleString("pt-BR")} ervas</strong>}</div>)}</Panel>}
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
  </div><footer>DISTRITO ZERO • HOLOCAUSTO Z<br/><small>PRODUZA. VENDA. FORTALEÇA O SERVIDOR.</small></footer>
 </main>
}
function Card(p:any){return <button className="card" onClick={p.onClick}><span>{p.icon}</span><h3>{p.title}</h3><p>{p.text}</p><b>ACESSAR →</b></button>}
function Price(p:any){return <div><b>{p.title}</b><span>{p.detail}</span><strong>{p.value}</strong></div>}
function Panel(p:any){return <section className="panel"><h2>{p.title}</h2>{p.children}</section>}