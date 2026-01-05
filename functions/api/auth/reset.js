export async function onRequestPost(context) {
  try {
    const { username, inviteCode, newPassword } = await context.request.json();

    if (!username || !inviteCode || !newPassword) {
      return new Response(JSON.stringify({ error: "信息不完整" }), { status: 400 });
    }

    // 1. 查找用户 ID
    const user = await context.env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: "用户不存在" }), { status: 404 });
    }

    // 2. 验证邀请码是否属于该用户
    const codeRecord = await context.env.DB.prepare(
      "SELECT * FROM invite_codes WHERE code = ? AND used_by = ?"
    ).bind(inviteCode, user.id).first();

    if (!codeRecord) {
      return new Response(JSON.stringify({ error: "邀请码不匹配，无法验证身份" }), { status: 403 });
    }

    // 3. 哈希新密码
    const myText = new TextEncoder().encode(newPassword);
    const myDigest = await crypto.subtle.digest({ name: 'SHA-256' }, myText);
    const hashArray = Array.from(new Uint8Array(myDigest));
    const newPasswordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 4. 更新数据库
    await context.env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
      .bind(newPasswordHash, user.id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
