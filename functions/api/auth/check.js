export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('id');

    if (!userId) {
      return new Response(JSON.stringify({ valid: false }), { status: 400 });
    }

    // 查询用户是否存在
    const user = await context.env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(userId).first();
    
    if (!user) {
      return new Response(JSON.stringify({ valid: false }), { 
        status: 200, // 返回 200 但 valid: false，方便前端处理
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } 
      });
    }

    return new Response(JSON.stringify({ valid: true }), { 
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } 
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
