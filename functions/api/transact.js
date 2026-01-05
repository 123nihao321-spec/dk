export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB.prepare("SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 50").all();
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
    const { userId, userName, userAvatar, itemName, itemIcon, cost, date } = await context.request.json();
    await context.env.DB.prepare(
      "INSERT INTO transactions (user_id, user_name, user_avatar, item_name, item_icon, cost, timestamp, date_str) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(userId, userName, userAvatar, itemName, itemIcon, cost, Date.now(), date).run();
    return new Response("Success", { status: 200 });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}