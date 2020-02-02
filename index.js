const execSync = require('child_process').execSync;
const puppeteer = require('puppeteer');
const program = require("commander");

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));
 
program
  .requiredOption("-u, --url <s>", "target url")
  .option("-t, --time <n>", "interval time(ms)", parseInt, 10000)
  .parse(process.argv);

// 設定
const INTERVAL = program.time // ms
const TARGET_URL = program.url;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36'

const SKIP_RESOURCES = ["data:image/", ".css", ".jpg", ".jpeg", ".js", ".png", ".gif", ".webp", "favicon.ico"];

(async () => {
  const browser = await puppeteer.launch({ headless: false });

  let flag = true
  let cnt = 0
  while (flag) {
    await sleep(INTERVAL);


    // 各リクエストのレスポンスを検知
    (async () => {
      // 新しいタブでリクエスト
      const page = await browser.newPage();
      await page.setUserAgent(UA)
  
      page.on('response', response => {
        // 無駄なリソースは無視
        if (SKIP_RESOURCES.find(r => ~response.url().indexOf(r))) {
          return
        }
        // ログ
        cnt++
        if (cnt % 10 === 0) {
          console.log(cnt, ':', response.status(), response.url()) // 全リクエストのステータスコードとURLをlog
        }
        // 500系はタブ閉じる
        if (response.status() >= 500) {
          return page.close().catch(() => {})
        }
        if (response.status() == 200) {
          console.log('＊＊＊＊ランディング成功＊＊＊＊', cnt, ':', response.status(), response.url()) // 全リクエストのステータスコードとURLをlog
          execSync(`osascript -e 'display notification "うまくいったぞおおおお" with title "ランディング成功"'`);
          flag = false
        }
      });
  
      await page.goto(TARGET_URL, {waitUntil: 'load', timeout: 0}).catch(() => {page.close().catch(() => {})});
    })(browser, cnt)
  }

  // await browser.close();
})();