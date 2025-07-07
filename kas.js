const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');

// CONFIG
const SITE_URL = 'https://faucet.zealousswap.com/';
const CAPTCHA_API_KEY = '7fa9fe01d6e280530733092087f3d2bd';
const DELAY_MS = 10000; // jeda antar klaim (10 detik)

// Fungsi delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Fungsi solve hCaptcha dengan 2Captcha
async function solveCaptcha(sitekey, pageurl) {
  console.log('[*] Mengirim captcha ke 2captcha...');
  const { data } = await axios.post(`http://2captcha.com/in.php?key=${CAPTCHA_API_KEY}&method=hcaptcha&sitekey=${sitekey}&pageurl=${pageurl}&json=1`);
  const captchaId = data.request;

  for (let i = 0; i < 24; i++) {
    await delay(5000);
    const res = await axios.get(`http://2captcha.com/res.php?key=${CAPTCHA_API_KEY}&action=get&id=${captchaId}&json=1`);
    if (res.data.status === 1) {
      console.log('[+] Captcha berhasil diselesaikan!');
      return res.data.request;
    }
  }

  throw new Error('Gagal menyelesaikan captcha.');
}

// Fungsi utama klaim
async function claimFaucet(wallet) {
  console.log(`\n[>] Memulai klaim untuk wallet: ${wallet}`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(SITE_URL, { waitUntil: 'networkidle2' });

  try {
    // Input wallet address
    await page.type('input[name="address"]', wallet, { delay: 50 });

    // Tunggu iframe hcaptcha muncul
    await page.waitForSelector('iframe[src*="hcaptcha.com"]', { timeout: 10000 });
    const frame = await page.$('iframe[src*="hcaptcha.com"]');
    const src = await frame.evaluate((el) => el.getAttribute('src'));
    const sitekey = new URL(src).searchParams.get('sitekey');

    // Solve captcha
    const token = await solveCaptcha(sitekey, SITE_URL);

    // Inject token ke form
    await page.evaluate((token) => {
      document.querySelector('[name="h-captcha-response"]').style.display = 'block';
      document.querySelector('[name="h-captcha-response"]').value = token;
    }, token);

    // Submit form
    const button = await page.$('button[type="submit"]');
    await button.click();

    // Tunggu hasil klaim
    await page.waitForTimeout(5000);
    console.log(`[✓] Klaim selesai untuk ${wallet}`);
  } catch (err) {
    console.error(`[x] Gagal klaim untuk ${wallet}:`, err.message);
  }

  await browser.close();
}

// Baca wallet list
async function main() {
  const wallets = fs.readFileSync('wallets.txt', 'utf-8').split('\n').filter(Boolean);

  for (const wallet of wallets) {
    await claimFaucet(wallet);
    await delay(DELAY_MS);
  }
}

main();
