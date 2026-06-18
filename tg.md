# Промпт: Добавление обработки заказов через Telegram-бота

Ты — опытный fullstack-разработчик. Перед тобой стоит задача: добавить на существующий сайт продажи сантехники функционал отправки заказов в Telegram-бота. Сайт уже написан на чистом HTML/CSS/JS в одном файле `index.html`.

## Задача

Создать безопасную систему, которая будет:
1. Принимать данные из формы заказа на сайте.
2. Отправлять эти данные в Telegram-бот продавца.
3. Показывать пользователю уведомление об успешной отправке.

## Техническое решение

Использовать связку: **Cloudflare Worker** (посредник) + **Telegram Bot API**.

### Почему именно так?
- Безопасность: токен бота хранится на сервере Cloudflare, а не в коде сайта.
- Бесплатно: 100 000 запросов в день бесплатно.
- Простота: не нужен свой сервер или платный хостинг.

---

## Что нужно сделать

### Часть 1: Создать Cloudflare Worker

Создай файл `worker.js` со следующим содержимым:

```javascript
export default {
  async fetch(request, env) {
    // Настройка CORS для безопасности
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // В продакшене замени на свой домен
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Обработка предварительного запроса OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Принимаем только POST-запросы
    if (request.method !== 'POST') {
      return new Response('Метод не разрешен', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    try {
      // Получаем данные заказа от сайта
      const orderData = await request.json();

      // Формируем красивое сообщение для Telegram
      const message = `
      🛁 *Новый заказ!*
      
      👤 Имя: ${orderData.name || 'Не указано'}
      📞 Телефон: ${orderData.phone || 'Не указано'}
      📦 Товар: ${orderData.product || 'Не указан'}
      💰 Сумма: ${orderData.total || 'Не указана'}
      📝 Комментарий: ${orderData.comment || 'Нет'}
      `;

      // Отправляем в Telegram
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

      if (!response.ok) {
        throw new Error('Ошибка при отправке в Telegram');
      }

      // Возвращаем успешный ответ сайту
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};