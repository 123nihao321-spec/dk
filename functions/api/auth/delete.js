export async function onRequestPost(context) {
  try {
    const { userId, password } = await context.request.json();

    if (!userId || !password) {
      return new Response(JSON.stringify({ error: "信息不完整" }), { status: 400 });
    }

    const user = await context.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
    if (!user) {
      return new Response(JSON.stringify({ error: "用户不存在" }), { status: 404 });
    }

    const myText = new TextEncoder().encode(password);
    const myDigest = await crypto.subtle.digest({ name: 'SHA-256' }, myText);
    const hashArray = Array.from(new Uint8Array(myDigest));
    const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (inputHash !== user.password_hash) {
      return new Response(JSON.stringify({ error: "密码错误，无法注销" }), { status: 403 });
    }

    // 执行删除操作
    await context.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
    // 核心更新：同时也删除邀请码
    await context.env.DB.prepare("DELETE FROM invite_codes WHERE used_by = ?").bind(userId).run();
    await context.env.DB.prepare("DELETE FROM transactions WHERE user_id = ?").bind(userId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
