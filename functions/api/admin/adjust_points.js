export async function onRequestPost(context) {
  try {
    const { userId, amount, reason } = await context.request.json();
    
    // 1. 直接修改用户表里的积分
    await context.env.DB.prepare(
      "UPDATE users SET points = points + ? WHERE user_id = ?"
    ).bind(amount, userId).run();

    // 2. 插入一条变动流水，方便查账
    await context.env.DB.prepare(
      "INSERT INTO transactions (user_id, user_name, user_avatar, item_name, item_icon, cost, timestamp, date_str) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(userId, "系统管理员", "👑", reason || "管理员调整", amount > 0 ? "➕" : "➖", -amount, Date.now(), new Date().toLocaleString()).run();

    return new Response("Adjusted", { status: 200 });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}