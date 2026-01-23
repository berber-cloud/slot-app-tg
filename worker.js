export default {
  async fetch(request, env, ctx) {
    // Этот код берет входящий запрос и ищет подходящий файл в ваших Assets (index.html и т.д.)
    const response = await env.ASSETS.fetch(request);
    
    // Если файл найден — отдаем его, если нет (404) — отдаем index.html (полезно для Web Apps)
    if (response.status === 404) {
      return env.ASSETS.fetch(new Request(new URL('/', request.url)));
    }
    
    return response;
  },
};
