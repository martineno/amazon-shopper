### Amazon Whole Foods Shopper

- Checks for open delivery windows
- If open delivery window is found, complete purchase
- Uses Google Chrome, with Puppeteer for automation

### Instructions

1. `git clone git@github.com:albertywu/amazon-shopper.git`

2. `yarn setup`
   This command will start up a fresh instance of Google Chrome. All browser information (session data, etc) are stored locally in `./chrome-data-dir` and are sandboxed there. Login to Amazon, and set up your Whole Foods shopping cart with items you'd like to purchase.

3. `yarn checkout`
   This command will start the checkout process, which 1) looks for open delivery windows, and 2) completes purchase if an open window is found. From time to time Amazon will complain about various things like items being out of stock. When this happens, the app will blindly accept default suggestions (by clicking "Continue"), bringing us back to the checkout page.

### [Optional] Configure Emailer

To send email notifications, create a `config.json` file with the following structure:

```
{
  "smtpConfig": {
    "host": <string; SMTP host>,
    "port": <number; SMTP port>,
    "auth": {
      "user": <string; username>,
      "pass": <string; password>
    }
  },
  "emailRecipients": <array of strings; emails>
}
```
