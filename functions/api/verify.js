export async function onRequestPost(context) {
  try {
    const { password } = await context.request.json();
    
    // 获取 Cloudflare 环境变量，如果没有设置，自动回退到 "888"
    // 这样保证了您在本地运行或环境变量未生效时也能登录
    const correctPassword = context.env.ADMIN_PASSWORD || "888";

    if (password === correctPassword) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ success: false }), { status: 401 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
  }
}