export async function onRequestPost(context) {
  try {
    const { username, password, nickname, inviteCode } = await context.request.json();

    if (!username || !password || !inviteCode) {
      return new Response(JSON.stringify({ error: "信息不完整" }), { status: 400 });
    }

    // 1. 验证邀请码
    const codeRecord = await context.env.DB.prepare("SELECT * FROM invite_codes WHERE code = ? AND is_used = 0").bind(inviteCode).first();
    
    if (!codeRecord) {
      return new Response(JSON.stringify({ error: "邀请码无效或已被使用" }), { status: 403 });
    }

    // 2. 检查用户名是否存在
    const existingUser = await context.env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
    if (existingUser) {
      return new Response(JSON.stringify({ error: "用户名已存在" }), { status: 409 });
    }

    // 3. 密码哈希 (简单的 SHA-256)
    const myText = new TextEncoder().encode(password);
    const myDigest = await crypto.subtle.digest({ name: 'SHA-256' }, myText);
    const hashArray = Array.from(new Uint8Array(myDigest));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 4. 创建用户
    const userId = 'u_' + Math.random().toString(36).substr(2, 9);
    const avatar = '🤠'; // 默认头像
    
    await context.env.DB.prepare(
      "INSERT INTO users (id, username, password_hash, nickname, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(userId, username, passwordHash, nickname || username, avatar, Date.now()).run();

    // 5. 标记邀请码已使用
    await context.env.DB.prepare("UPDATE invite_codes SET is_used = 1, used_by = ? WHERE code = ?").bind(userId, inviteCode).run();

    return new Response(JSON.stringify({ success: true, user: { id: userId, username, nickname, avatar } }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}