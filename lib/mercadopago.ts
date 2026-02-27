import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

function getClient(accessToken: string) {
  return new MercadoPagoConfig({ accessToken });
}

export async function createPreference(
  accessToken: string,
  opts: {
    orderId: string;
    title: string;
    amount: number;
    currency?: string;
    backUrlBase: string;
    tableId?: string;
  }
) {
  const client = getClient(accessToken);
  const preference = new Preference(client);
  const returnPath = opts.tableId ? `/menu?tableId=${opts.tableId}` : "/menu";

  return preference.create({
    body: {
      items: [
        {
          id: opts.orderId,
          title: opts.title,
          quantity: 1,
          unit_price: opts.amount,
          currency_id: opts.currency ?? "PEN",
        },
      ],
      back_urls: {
        success: `${opts.backUrlBase}${returnPath}?mp=success`,
        failure: `${opts.backUrlBase}${returnPath}?mp=failure`,
        pending: `${opts.backUrlBase}${returnPath}?mp=pending`,
      },
      auto_return: "approved",
      external_reference: opts.orderId,
      notification_url: `${opts.backUrlBase}/api/webhooks/mercadopago`,
    },
  });
}

export async function getPaymentById(accessToken: string, paymentId: string) {
  const client = getClient(accessToken);
  const payment = new Payment(client);
  return payment.get({ id: Number(paymentId) });
}
