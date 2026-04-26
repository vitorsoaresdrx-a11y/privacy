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

    const generateCPF = () => {
      const n = () => Math.floor(Math.random() * 9);
      let n1 = n(), n2 = n(), n3 = n(), n4 = n(), n5 = n(), n6 = n(), n7 = n(), n8 = n(), n9 = n();
      let d1 = 11 - ((n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10) % 11);
      if (d1 >= 10) d1 = 0;
      let d2 = 11 - ((d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11) % 11);
      if (d2 >= 10) d2 = 0;
      return '' + n1 + n2 + n3 + n4 + n5 + n6 + n7 + n8 + n9 + d1 + d2;
    };

    const payload = {
      amount: parseFloat(amountRaw),
      identifier: `BRUMACCIO_${Date.now()}`,
      client: {
        name: "Cliente VIP",
        document: generateCPF(),
        email: "vip@brumaccio.com",
        phone: "11999999999"
      }
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
