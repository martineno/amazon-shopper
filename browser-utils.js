import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function launchChrome() {
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
        resolve({
          browserWSEndpoint,
          kill: () => cp.kill(),
        });
      }
    });
  });
}

export function api(page) {
  return {
    goto: async (url) => {
      return Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        page.goto(url),
      ]);
    },
    has: async (content) => {
      const innerText = await page.evaluate(() => document.body.innerText);
      return innerText.includes(content);
    },
    click: async (selector) => page.click(selector),
    clickAndWait: async (selector) => {
      return await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        page.click(selector),
      ]);
    },
    content: async () => page.content(),
    screenshot: async (path) => page.screenshot({ path }),
  };
}
