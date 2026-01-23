export default {
  async fetch(request, env) {
    // В 2026 году Workers Assets позволяют отдавать файлы напрямую
    return await env.ASSETS.fetch(request);
  },
};
