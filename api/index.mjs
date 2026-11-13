export default async function apiHandler(request, response) {
  try {
    const url = new URL(request.url, 'https://coredesk.invalid');
    const route = url.searchParams.get('route');
    if (route !== null) {
      url.searchParams.delete('route');
      request.url = '/api/' + route + (url.search ? '?' + url.searchParams.toString() : '');
    }
    const { handler } = await import('../server/server.mjs');
    await handler(request, response);
  } catch {
    response.statusCode = 503;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify({ message: 'API deployment configuration is incomplete.' }));
  }
}
