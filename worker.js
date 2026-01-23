export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Пытаемся получить файл из Assets
    let response = await env.ASSETS.fetch(request);

    // Если файл не найден (404), пробуем отдать index.html (для SPA)
    if (response.status === 404) {
      const indexRequest = new Request(new URL('/', request.url));
      response = await env.ASSETS.fetch(indexRequest);
    }

    // Создаем новый ответ на основе полученного, чтобы гарантировать заголовки
    const newResponse = new Response(response.body, response);

    // Если это главный файл, принудительно ставим тип HTML
    if (url.pathname === '/' || url.pathname.endsWith('.html')) {
      newResponse.headers.set('Content-Type', 'text/html; charset=utf-8');
    }

    return newResponse;
  },
};

