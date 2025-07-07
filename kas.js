require('dotenv').config();
const axios = require('axios');
const qs = require('qs');
const wallets = ['0xf2daae1a26c9a0dbaf8e8640f78172af6f75b28c', '0xWallet2', '0xWallet3'];
const API_KEY = process.env.API_KEY_2CAPTCHA;

async function solveCaptcha(siteKey, pageUrl) {
  const resp1 = await axios.post('http://2captcha.com/in.php', qs.stringify({
    key: API_KEY,
    method: 'hcaptcha',
    sitekey: siteKey,
    pageurl: pageUrl,
    json: 1
  }));
  if (resp1.data.status !== 1) throw new Error('2Captcha error: ' + resp1.data.request);

  const reqId = resp1.data.request;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const resp2 = await axios.get('http://2captcha.com/res.php', {
      params: { key: API_KEY, action: 'get', id: reqId, json: 1 }
    });
    if (resp2.data.status === 1) return resp2.data.request;
    if (resp2.data.request !== 'CAPCHA_NOT_READY') throw new Error('Captcha failed: ' + resp2.data.request);
  }
  throw new Error('Timeout solving captcha');
}

async function claim(wallet) {
  console.log(`🚀 Klaim untuk ${wallet}...`);

  const url = 'https://faucet.zealousswap.com/';
  const html = (await axios.get(url)).data;
  const siteKey = html.match(/data-sitekey="([^"]+)"/)[1];

  const token = await solveCaptcha(siteKey, url);
  const post = {
    wallet: wallet,
    'h-captcha-response': token
  };

  const res = await axios.post(url, qs.stringify(post), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  console.log(res.data);
}

(async () => {
  for (const w of wallets) {
    try {
      await claim(w);
      await new Promise(r => setTimeout(r, 60000)); // jeda 1 menit
    } catch (e) {
      console.error('❌ Error:', e.message);
    }
  }
})();
