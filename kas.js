require('dotenv').config();
const axios = require('axios');
const qs = require('qs');

const API_KEY = process.env.API_KEY_2CAPTCHA;
const SITEKEY = 'b8f64404-5636-4dd6-851a-9dc818dea77a';
const PAGE_URL = 'https://faucet.zealousswap.com/';
const CLAIM_URL = 'https://faucet.zealousswap.com/api/claim';

const wallets = [
  '0xf2daae1a26c9a0dbaf8e8640f78172af6f75b28c',
  '0xWallet2',
  '0xWallet3'
];

async function solveCaptcha() {
  console.log('🧩 Mengirim captcha ke 2Captcha...');
  const resp1 = await axios.post('http://2captcha.com/in.php', qs.stringify({
    key: API_KEY,
    method: 'hcaptcha',
    sitekey: SITEKEY,
    pageurl: PAGE_URL,
    json: 1
  }));

  if (resp1.data.status !== 1) throw new Error('2Captcha error: ' + resp1.data.request);
  const requestId = resp1.data.request;

  console.log('⏳ Menunggu hasil captcha...');
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const res = await axios.get('http://2captcha.com/res.php', {
      params: {
        key: API_KEY,
        action: 'get',
        id: requestId,
        json: 1
      }
    });

    if (res.data.status === 1) {
      console.log('✅ Captcha berhasil diselesaikan');
      return res.data.request;
    } else if (res.data.request !== 'CAPCHA_NOT_READY') {
      throw new Error('Captcha gagal: ' + res.data.request);
    }
  }

  throw new Error('Captcha timeout (lebih dari 100 detik)');
}

async function claim(wallet) {
  try {
    console.log(`🚀 Mulai klaim untuk: ${wallet}`);
    const token = await solveCaptcha();

    const res = await axios.post(CLAIM_URL, {
      wallet_address: wallet,
      captcha_response: token
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': PAGE_URL,
        'Referer': PAGE_URL,
        'User-Agent': 'Mozilla/5.0 (Android; Mobile; rv:109.0)'
      }
    });

    if (res.data.success) {
      console.log(`🎉 Sukses: ${res.data.message || 'Token dikirim!'}`);
      if (res.data.tx_hash) {
        console.log(`🔗 TX Hash: ${res.data.tx_hash}`);
      }
    } else {
      console.log(`⚠️ Gagal: ${res.data.message || 'Tidak diketahui'}`);
    }
  } catch (err) {
    console.error(`❌ Error klaim untuk ${wallet}:`, err.message);
  }
}

(async () => {
  for (const wallet of wallets) {
    await claim(wallet);
    await new Promise(r => setTimeout(r, 30000)); // jeda antar wallet
  }
})();
