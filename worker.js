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
      const data = await request.json();

      let message;
      if (data.type === 'consultation') {
        message = `
📞 *Запрос консультации!*

👤 *Имя:* ${data.name || 'Не указано'}
📞 *Телефон:* ${data.phone || 'Не указано'}
💬 *Комментарий:* ${data.comment || 'Нет'}
        `.trim();
      } else {
        const itemsList = data.items
          ? data.items
              .map((item) => `• ${item.name} — ${item.price} Р × ${item.qty}`)
              .join('\n')
          : 'Не указан';

        message = `
🛁 *Новый заказ!*

👤 *Имя:* ${data.name || 'Не указано'}
📞 *Телефон:* ${data.phone || 'Не указано'}
📧 *Email:* ${data.email || 'Не указан'}
📍 *Адрес:* ${data.address || 'Не указан'}
🚚 *Доставка:* ${data.delivery === 'pickup' ? 'Самовывоз' : 'Курьером'}
💳 *Оплата:* ${data.payment === 'cash' ? 'Наличными' : 'Картой'}

*Состав заказа:*
${itemsList}

💰 *Итого:* ${data.total || 0} Р
📝 *Комментарий:* ${data.comment || 'Нет'}
        `.trim();
      }

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
