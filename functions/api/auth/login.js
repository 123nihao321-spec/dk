export async function onRequestPost(context) {
  try {
    const { username, password } = await context.request.json();

    // 1. 查找用户
    const user = await context.env.DB.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: "用户不存在" }), { status: 401 });
    }

    // 2. 验证密码
    const myText = new TextEncoder().encode(password);
    const myDigest = await crypto.subtle.digest({ name: 'SHA-256' }, myText);
    const hashArray = Array.from(new Uint8Array(myDigest));
    const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (inputHash !== user.password_hash) {
      return new Response(JSON.stringify({ error: "密码错误" }), { status: 401 });
    }

    // 3. 返回用户信息
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}