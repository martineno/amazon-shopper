import puppeteer from "puppeteer";
import { launchChrome, api } from "./browser-utils.js";
import Push from "pushover-notifications";
import { readFileSync } from 'fs';

const { user, token } = JSON.parse(readFileSync('config-pushover.json'));

const pusher = new Push({
  user,
  token,
});

function sendNotification({
  hasOpenWindow,
  imageBuffer,
  nextAttempt,
  tryCount,
}) {
  const NO_ALERT = -2;
  const QUIET_NOTIFICATION = -1;
  const NORMAL = 0;
  const HIGH_PRIORITY = 1;
  const REQUIRE_CONFIRMATION = 2;

  const notAvailable = {
    title: `No delivery windows found on ${tryCount + 1} try`,
    message: `Sadness... Next attempt at ${nextAttempt.toLocaleString("en-US", {
      hour12: false,
    })}`,
    device: "StockholmSyndrome",
    priority: QUIET_NOTIFICATION,
    file: { name: "screenshot.png", data: imageBuffer },
  };

  const available = {
    title: `Found a delivery window found on ${tryCount + 1} try`,
    message: "Hapiness...",
    device: "StockholmSyndrome",
    priority: NORMAL,
    file: { name: "screenshot.png", data: imageBuffer },
  };

  const message = hasOpenWindow ? available : notAvailable;

  return new Promise((resolve, reject) => {
    pusher.send(message, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

async function init() {
  const { browserWSEndpoint, kill } = await launchChrome();
  const browser = await puppeteer.connect({
    browserWSEndpoint,
    defaultViewport: null,
  });
  return browser;
}

async function startCheckout({ goto, clickAndWait }) {
  const start = "https://www.amazon.com/gp/cart/view.html";
  await goto(start);
  await clickAndWait("#gutterCartViewForm input[type=submit]");
}

async function continueOnTheSuggestions({ clickAndWait }) {
  await clickAndWait("a[name=proceedToCheckout]");
}

async function checkAvailableWindows({ has }) {
  const NO_WINDOW_TEXT = "No delivery windows available";
  return !(await has(NO_WINDOW_TEXT));
}

function selectSlot({ click }) {
  // There are multiple slots, pick the first one that is available
  const SLOT_SELECTOR = ".ufss-slot.ufss-available";
  click(SLOT_SELECTOR);
}

async function checkout({ clickAndWait }) {
  const CHECKOUT_BUTTON_SELECTOR =
    "form.ufss-page-conductor-form input[type=submit]";
  await clickAndWait(CHECKOUT_BUTTON_SELECTOR);
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function* findFreshSlot(
  delayBetweenAttempts = 5 * 60 * 1000,
  totalTries = Infinity
) {
  const browser = await init();

  for (let retry = 0; retry < totalTries; retry++) {
    console.log(`Try ${retry + 1} of ${totalTries}.`);
    const page = await browser.newPage();
    const pageApi = api(page);

    await startCheckout(pageApi);
    await continueOnTheSuggestions(pageApi);
    yield {
      hasOpenWindow: await checkAvailableWindows(pageApi),
      imageBuffer: await page.screenshot(),
      nextAttempt: new Date(Date.now() + delayBetweenAttempts),
      tryCount: retry,
      page,
    };

    await page.close();
    if (retry + 1 < totalTries) {
      console.log(
        `Waiting for ${delayBetweenAttempts / 1000} seconds before retrying.`
      );
      await delay(delayBetweenAttempts);
    }
  }
}

(async () => {
  const NUM_TRIES = 20;
  const WAIT_BETWEEN_TRIES = 10 * 60 * 1000;
  for await (const {
    hasOpenWindow,
    imageBuffer,
    nextAttempt,
    tryCount,
    page,
  } of findFreshSlot(WAIT_BETWEEN_TRIES, NUM_TRIES)) {
    const pageApi = api(page);
    if (hasOpenWindow) {
      console.log("Found window!");
      await sendNotification({
        hasOpenWindow,
        imageBuffer,
        nextAttempt,
        tryCount,
      });
      selectSlot(pageApi);
      // checkout(pageApi);
      break;
    } else {
      console.log("No open window :(");
      await sendNotification({
        hasOpenWindow,
        imageBuffer,
        nextAttempt,
        tryCount,
      });
    }
  }
  console.log("Finished checking.");
})();
