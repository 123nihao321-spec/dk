export async function onRequestGet(context) {
  try {
    // 获取所有用户列表 (不返回密码hash)
    const { results } = await context.env.DB.prepare(
      "SELECT id, username, nickname, avatar, created_at FROM users ORDER BY created_at DESC"
    ).all();
    
    return new Response(JSON.stringify(results), { 
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store' 
      } 
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('id');

    if (!userId) {
      return new Response("Missing User ID", { status: 400 });
    }

    // 1. 删除用户表记录
    await context.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
    
    // 2. 删除关联的邀请码 (满足需求 2：用户注销/删除后，邀请码随之消失)
    await context.env.DB.prepare("DELETE FROM invite_codes WHERE used_by = ?").bind(userId).run();

    // 3. 删除关联的交易记录 (清理垃圾数据)
    await context.env.DB.prepare("DELETE FROM transactions WHERE user_id = ?").bind(userId).run();

    return new Response(JSON.stringify({ success: true }), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
