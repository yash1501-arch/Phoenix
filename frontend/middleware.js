const BOT_UA =
  /facebookexternalhit|Facebot|WhatsApp|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|Pinterest|Googlebot/i;

const API_BASE = process.env.VITE_API_URL || 'https://api.phoenixadventures.in/api';

export const config = {
  matcher: ['/adventure/:path*'],
};

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_UA.test(ua)) {
    return;
  }

  const { pathname } = request.nextUrl;
  const match = pathname.match(/^\/adventure\/([^/]+)\/?$/);
  if (!match) {
    return;
  }

  const shareUrl = `${API_BASE.replace(/\/$/, '')}/share/adventure/${match[1]}`;
  try {
    const upstream = await fetch(shareUrl, {
      headers: { 'User-Agent': ua },
    });
    if (!upstream.ok) {
      return;
    }
    const body = await upstream.text();
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    return;
  }
}
