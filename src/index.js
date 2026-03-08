export default {
  async fetch(request, env, ctx) {
    return new Response("<h1>Hello World</h1>", {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  }
}