// Vercel Serverless Function - 한국 공식 사이트 프록시
// 파일 위치: api/proxy.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url 파라미터 필요' });

  // 한국 공식 사이트만 허용
  const decoded = decodeURIComponent(url);
  if (!decoded.startsWith('https://onepiece-cardgame.kr')) {
    return res.status(403).json({ error: '허용되지 않는 URL' });
  }

  // 타임아웃 처리 (10초)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(decoded, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://onepiece-cardgame.kr/',
        'Cache-Control': 'no-cache',
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({ error: `원본 서버 응답 오류: ${response.status}` });
    }

    const text = await response.text();

    // 응답이 비어있거나 카드 데이터 없으면 404
    if (!text || text.length < 100) {
      return res.status(404).json({ error: '빈 응답' });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5분 캐시
    res.status(200).send(text);

  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      return res.status(504).json({ error: '요청 시간 초과 (10초)' });
    }
    console.error('proxy.js error:', e);
    res.status(500).json({ error: e.message || '프록시 오류' });
  }
}
