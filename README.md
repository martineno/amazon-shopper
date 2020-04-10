# Amazon Shopper

• Checks for open delivery windows
• If open delivery window is found, complete purchase
• Uses Google Chrome, with Puppeteer for automation

# Instructions

1. git clone <TODO>

2. `yarn setup.sh`
   This command will start up a fresh instance of chrome. Login to Amazon, and set up your Whole Foods shopping cart so it's ready to go.

3. `yarn checkout`
   This command will start the checkout process, which 1) looks for open delivery windows, and 2) completes purchase if an open window is found. From time to time Amazon will complain about various things like items being out of stock. When this happens, the app will blindly accept default suggestions (by clicking "Continue"), bringing us back to the checkout page.

# [Optional] Configure Emailer

To send email notifications, create a `config.json` file with the following structure:

```
{
  "nodemailerConfig": {
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
