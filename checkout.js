const puppeteer = require("puppeteer");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { spawn } = require("child_process");
const [_, __, browserWSEndpoint] = process.argv;

(async () => {
  const emailer = await getEmailer();
  const { browserWSEndpoint } = await launchChrome();
  const browser = await puppeteer.connect({
    browserWSEndpoint,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  const { go, has, click, content } = api(page);
  const start =
    "https://www.amazon.com/gp/buy/shipoptionselect/handlers/display.html?hasWorkingJavascript=1";

  let attempts = 0;

  while (true) {
    await go(start);
    if (await has("No delivery windows available")) {
      console.log(`[${attempts}] No delivery windows available. Trying again.`);
    } else if (await has("Checkout Whole Foods Market Cart")) {
      console.log(`Checkout Whole Foods Market Cart`);
      await click('input[name^="proceedToALMCheckout"]');
      await click('a[name="proceedToCheckout"]');
      await click('input[type="submit"]');
    } else if (
      await has("We're sorry we are unable to fulfill your entire order")
    ) {
      console.log("We're sorry we are unable to fulfill your entire order");
      break; // TODO: handle this case
    } else if (await has("Recommended for you")) {
      console.log("Recommended for you");
      await click("a#nav-cart");
      await click('input[name^="proceedToALMCheckout"]');
      await click('a[name="proceedToCheckout"]');
      await click('input[type="submit"]');
    } else if (
      await has("An error occurred when we tried to process your request")
    ) {
      console.log("An error occured when we tried to process your request");
      await click("a#nav-cart");
      await click('input[name^="proceedToALMCheckout"]');
      await click('a[name="proceedToCheckout"]');
      await click('input[type="submit"]');
    } else {
      // Found slot!
      console.log("Found a slot!");
      await mail(emailRecipients, `just a test`, await content());
      await snap(`artifacts/checkout-page1.png`);
      break; // TODO: handle this case
    }
    attempts++;
  }
})();

function api(page) {
  return {
    go: async (url) => page.goto(url, { waitUntil: "networkidle0" }),
    has: async (content) => (await page.content()).includes(content),
    click: async (selector) => {
      console.log(`clicked ${selector}`);
      return Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        page.click(selector),
      ]);
    },
    content: async () => page.content(),
    snap: async (path) => page.screenshot({ path }),
  };
}

async function getEmailer() {
  const fs = require("fs");
  if (!fs.existsSync("config.json")) {
    console.warn(
      "Emailer not configured. To send notification emails, configure `config.json` with email smtp settings"
    );
    return { mail: async () => {} };
  }
  const { nodemailerConfig, emailRecipients } = JSON.parse(
    fs.readFileSync("config.json", "utf8")
  );
  const nodemailer = require("nodemailer");
  const transport = nodemailer.createTransport({
    ...nodemailerConfig,
  });
  return {
    mail: async (to, subject, text) => {
      return new Promise((resolve, reject) => {
        transport.sendMail(
          {
            from: nodemailerConfig.auth.user,
            to,
            subject,
            text,
          },
          (err, info) => {
            if (err) {
              reject(err);
            } else {
              resolve(info);
            }
          }
        );
      });
    },
  };
}

async function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function launchChrome() {
  return new Promise((resolve, reject) => {
    const cp = spawn(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // prettier-ignore
      [
        "--remote-debugging-port=9222",
        "--no-first-run",
        "--no-default-browser-check",
        `--user-data-dir=${__dirname}/chrome-data-dir`,
      ]
    );
    let stderr = "";
    cp.stderr.on("data", (data) => {
      stderr += data;
      if (stderr.includes("XXX Init()")) {
        const [_, browserWSEndpoint] = stderr.match(/listening on ([^\s]+)/);
        resolve({ browserWSEndpoint });
      }
    });
  });
}
