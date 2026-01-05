export async function onRequestGet(context) {
  try {
    // 获取所有邀请码
    const { results } = await context.env.DB.prepare("SELECT * FROM invite_codes ORDER BY created_at DESC").all();
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

export async function onRequestPost(context) {
  try {
    // 生成新邀请码
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await context.env.DB.prepare("INSERT INTO invite_codes (code, created_at) VALUES (?, ?)").bind(code, Date.now()).run();
    
    return new Response(JSON.stringify({ success: true, code }), { 
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store' 
      } 
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}