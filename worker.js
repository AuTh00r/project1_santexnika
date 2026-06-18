export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Метод не разрешен', {
        status: 405,
        headers: corsHeaders,
      });
    }

    try {
      const orderData = await request.json();

      const itemsList = orderData.items
        ? orderData.items
            .map((item) => `• ${item.name} — ${item.price} ₽ × ${item.qty}`)
            .join('\n')
        : 'Не указан';

      const message = `
🛁 *Новый заказ!*

👤 *Имя:* ${orderData.name || 'Не указано'}
📞 *Телефон:* ${orderData.phone || 'Не указано'}
📧 *Email:* ${orderData.email || 'Не указан'}
📍 *Адрес:* ${orderData.address || 'Не указан'}
🚚 *Доставка:* ${orderData.delivery === 'pickup' ? 'Самовывоз' : 'Курьером'}
💳 *Оплата:* ${orderData.payment === 'cash' ? 'Наличными' : 'Картой'}

*Состав заказа:*
${itemsList}

💰 *Итого:* ${orderData.total || 0} ₽
📝 *Комментарий:* ${orderData.comment || 'Нет'}
      `.trim();

      const telegramUrl = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      console.log('Telegram response status:', response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.log('Telegram error body:', errText);
        throw new Error(`Ошибка Telegram: ${errText}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }
  },
};
