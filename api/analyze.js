export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(401).json({
      error: 'ANTHROPIC_API_KEY가 설정되지 않았어요.',
      code: 'API_KEY_MISSING'
    });
  }

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages 배열이 필요해요' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 401) return res.status(401).json({ error: 'API 키가 유효하지 않아요', code: 'API_KEY_INVALID' });
      if (response.status === 429) return res.status(429).json({ error: '요청 한도 초과. 잠시 후 다시 시도해주세요.', code: 'RATE_LIMIT' });
      return res.status(response.status).json({ error: errData?.error?.message || `API 오류 (${response.status})` });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (e) {
    res.status(500).json({ error: e.message || '알 수 없는 오류' });
  }
}
