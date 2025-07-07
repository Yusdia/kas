const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const fs = require('fs');

// Konfigurasi
const API_KEY = '7fa9fe01d6e280530733092087f3d2bd';
const URL_FAUCET = 'https://faucet.zealousswap.com/'; // Ganti dengan faucet asli
const WALLET_LIST = [
  '0xf2daae1a26c9a0dbaf8e8640f78172af6f75b28c',
  '0xWalletAddress2',
  '0xWalletAddress3'
];

// Plugins
puppeteer.use(StealthPlugin());
puppeteer.use(RecaptchaPlugin({
  provider: {
    id: '2captcha',
    token: API_KEY
  },
  visualFeedback: true
}));

// Fungsi utama
async function claimFaucet(wallet) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    executablePath: 'chromium' // Ganti sesuai path Chromium di Termux
  });

  const page = await browser.newPage();
  console.log(`🔁 Mulai klaim untuk wallet: ${wallet}`);
  await page.goto(URL_FAUCET, { waitUntil: 'networkidle2' });

  await page.waitForSelector('input[name="wallet"]');
  await page.type('input[name="wallet"]', wallet);

  console.log('🔍 Menyelesaikan hCaptcha...');
  await page.solveRecaptchas();

  console.log('🚀 Submit klaim...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  console.log(`✅ Klaim selesai untuk: ${wallet}\n`);
  await browser.close();
}

// Jalankan untuk semua wallet
(async () => {
  for (const wallet of WALLET_LIST) {
    try {
      await claimFaucet(wallet);
      await new Promise(resolve => setTimeout(resolve, 10000)); // jeda 10 detik antar wallet
    } catch (err) {
      console.error(`❌ Gagal klaim untuk ${wallet}:`, err.message);
    }
  }
})();
