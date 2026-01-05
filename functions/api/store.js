export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB.prepare("SELECT * FROM store_items ORDER BY created_at DESC").all();
    return new Response(JSON.stringify(results), {
      headers: { 
        'Content-Type': 'application/json',
        // 核心修复：禁止缓存
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Expires': '0'
      }
    });
  } catch (e) {
    return Response.json([]);
  }
}

export async function onRequestPost(context) {
  try {
    const { name, cost, icon, desc } = await context.request.json();
    await context.env.DB.prepare(
      "INSERT INTO store_items (name, cost, icon, desc, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(name, cost, icon, desc, Date.now()).run();
    return new Response("Added", { status: 200 });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  await context.env.DB.prepare("DELETE FROM store_items WHERE id = ?").bind(id).run();
  return new Response("Deleted", { status: 200 });
}