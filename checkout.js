const puppeteer = require("puppeteer");

(async () => {
  const emailer = await getEmailer();
  const { browserWSEndpoint, kill } = await launchChrome();
  const browser = await puppeteer.connect({
    browserWSEndpoint,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  const { goto, has, clicks, content } = api(page);
  const start =
    "https://www.amazon.com/gp/buy/shipoptionselect/handlers/display.html?hasWorkingJavascript=1";

  let attempts = 0;

  while (true) {
    await goto(start);
    if (await has("No delivery windows available")) {
      console.log(`[${attempts}] No delivery windows available. Trying again.`);
    } else if (await has("Checkout Whole Foods Market Cart")) {
      console.log(`Checkout Whole Foods Market Cart`);
      await clicks([
        'input[name^="proceedToALMCheckout"]',
        'a[name="proceedToCheckout"]',
        'input[type="submit"]',
      ]);
    } else if (
      (await has("Recommended for you")) ||
      (await has("An error occurred when we tried to process your request"))
    ) {
      console.log("Recommended for you || An error occurred...");
      await clicks([
        "a#nav-cart",
        'input[name^="proceedToALMCheckout"]',
        'a[name="proceedToCheckout"]',
        'input[type="submit"]',
      ]);
    } else if (
      await has("We're sorry we are unable to fulfill your entire order")
    ) {
      console.log("We're sorry we are unable to fulfill your entire order");
      break; // TODO: handle this case
    } else {
      // Found slot!
      console.log("Found a slot!");
      await emailer.mail(`slot found`, await content());
      // select the first slot, then click the continue button
      await clicks(["li.ufss-slot-container", "input.a-button-input"]);

      break; // TODO: handle this case
    }
    attempts++;
  }
  // kill();
})();

function api(page) {
  return {
    goto: async (url) => {
      return Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        page.goto(url),
      ]);
    },
    has: async (content) => (await page.content()).includes(content),
    clicks: async (selectors) => {
      console.log(`clicking on ${selectors}`);
      for (let selector of selectors) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle0" }),
          page.click(selector),
        ]);
      }
    },
    content: async () => page.content(),
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
  const { smtpConfig: nodemailerConfig, emailRecipients } = JSON.parse(
    fs.readFileSync("config.json", "utf8")
  );
  const nodemailer = require("nodemailer");
  const transport = nodemailer.createTransport({
    ...nodemailerConfig,
  });
  return {
    mail: async (subject, text) => {
      return new Promise((resolve, reject) => {
        transport.sendMail(
          {
            from: nodemailerConfig.auth.user,
            to: emailRecipients,
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
    const { spawn } = require("child_process");
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
        resolve({
          browserWSEndpoint,
          kill: () => cp.kill(),
        });
      }
    });
  });
}
