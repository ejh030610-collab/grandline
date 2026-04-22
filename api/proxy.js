// Vercel Serverless Function - 한국 공식 사이트 프록시
// 파일 위치: api/proxy.js (GitHub 저장소 루트에 api 폴더 만들고 넣으세요)

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url 파라미터 필요' });

  // 한국 공식 사이트만 허용
  if (!url.startsWith('https://onepiece-cardgame.kr')) {
    return res.status(403).json({ error: '허용되지 않는 URL' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': 'https://onepiece-cardgame.kr/',
      }
    });

    const text = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(text);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
