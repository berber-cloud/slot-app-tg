export default {
  async fetch(request, env, ctx) {
    // Просто проксируем запрос к папке с файлами
    const response = await env.ASSETS.fetch(request);
    
    // Если файл не найден (например, при перезагрузке страницы SPA), отдаем index.html
    if (response.status === 404) {
      return env.ASSETS.fetch(new Request(new URL('/', request.url)));
    }
    
    return response;
  },
};
