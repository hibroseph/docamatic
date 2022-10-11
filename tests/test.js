const puppeteer = require("puppeteer");

console.log(__dirname);
var start = async function () {
  const extensionPath = `${__dirname}/../dist`;
  let browser = await puppeteer.launch({
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });

  const dummPage = await browser.newPage();
  await dummPage.waitForSelector("html");
};

start();
