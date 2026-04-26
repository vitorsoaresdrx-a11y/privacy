export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const amountRaw = body?.amount;

    if (!amountRaw) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const payload = {
      amount: parseFloat(amountRaw),
      identifier: `BRUMACCIO_${Date.now()}`
    };

    const fetchRes = await fetch('https://app.omegapayments.com.br/api/v1/gateway/pix/receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-public-key': 'yagododigital_mc6hvcok12a4jk9k',
        'x-secret-key': 'kxng049rc38fgnya0h6zvqiopwknrssdh3jsups2jlepztwj7g58azowdd2cnm08'
      },
      body: JSON.stringify(payload)
    });

    const data = await fetchRes.json();

    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({ error: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
