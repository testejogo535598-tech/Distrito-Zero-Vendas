import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const pedido = await request.json();

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: process.env.NOTIFICACAO_EMAIL || "jhon535598@gmail.com",
      subject: `🚨 Novo pedido #${pedido.id} - Distrito Zero`,
      html: `
        <h2>🚨 Novo pedido recebido</h2>

        <p><strong>Pedido:</strong> #${pedido.id}</p>
        <p><strong>Gamertag:</strong> ${pedido.gamertag}</p>
        <p><strong>Tipo:</strong> ${pedido.type === "venda" ? "Venda de ervas" : "Compra"}</p>

        <hr>

        <p><strong>🌿 Ervas:</strong> ${pedido.herbs}</p>
        <p><strong>🌱 Pacotes de sementes:</strong> ${pedido.seeds}</p>
        <p><strong>🧪 Fertilizante:</strong> ${pedido.fert}</p>
        <p><strong>💰 Valor total:</strong> ${pedido.total}</p>

        <hr>

        <p><strong>Status:</strong> Processando</p>

        <p>Entre no painel administrativo do Distrito Zero para verificar o pedido.</p>
      `,
    });

    if (error) {
      console.error("Erro Resend:", error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Erro na notificação:", error);

    return Response.json(
      { success: false, error: "Erro interno ao enviar notificação." },
      { status: 500 }
    );
  }
}
