import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const pedido = await request.json();

    const itensHtml = Array.isArray(pedido.items)
      ? pedido.items
          .map(
            (item: any) => `
              <div style="margin-bottom:12px;">
                <strong>${item.nome}</strong><br>
                Quantidade: ${Number(item.quantidade)}<br>
                Valor unitário: ${Number(item.valor).toLocaleString("pt-BR")} DZ Coins<br>
                Subtotal: ${Number(
                  item.valor * item.quantidade
                ).toLocaleString("pt-BR")} DZ Coins
              </div>
            `
          )
          .join("")
      : "<p>Nenhum item informado.</p>";

    const { error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "onboarding@resend.dev",

      to:
        process.env.NOTIFICACAO_EMAIL ||
        "jhon535598@gmail.com",

      subject: `🚨 Novo pedido da Loja #${pedido.id} - Distrito Zero`,

      html: `
        <h2>🚨 Novo pedido da Loja</h2>

        <p>
          <strong>Pedido:</strong> #${pedido.id}
        </p>

        <p>
          <strong>Gamertag:</strong> ${pedido.gamertag}
        </p>

        <hr>

        <h3>🛒 Produtos</h3>

        ${itensHtml}

        <hr>

        <p>
          <strong>💰 Valor total:</strong>
          ${Number(pedido.total).toLocaleString("pt-BR")} DZ Coins
        </p>

        <p>
          <strong>Status:</strong> Processando
        </p>

        <p>
          Entre no painel administrativo do Distrito Zero
          para verificar o pedido.
        </p>
      `,
    });

    if (error) {
      console.error("Erro Resend:", error);

      return Response.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error("Erro na notificação da Loja:", error);

    return Response.json(
      {
        success: false,
        error: "Erro interno ao enviar notificação.",
      },
      {
        status: 500,
      }
    );
  }
}
