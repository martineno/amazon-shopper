### Amazon Whole Foods Shopper

- Checks for open delivery windows
- If open delivery window is found, complete purchase
- Uses Google Chrome, with Puppeteer for automation

### Prerequisites

- Mac OS X (tested with 10.14.6)
- Google Chrome (tested with 81.0.4044.92)

### Instructions

1. Install

From your working directory:

```
git clone git@github.com:albertywu/amazon-shopper.git
cd amazon-shopper
yarn
```

2. `yarn setup`
   This command will start up a fresh instance of Google Chrome. All browser information (session data, etc) are stored locally in `./chrome-data-dir` and are sandboxed there. Login to Amazon, and set up your Whole Foods shopping cart with items you'd like to purchase.

3. `yarn checkout`
   This command will start the checkout process, which 1) looks for open delivery windows, and 2) completes purchase if an open window is found. From time to time Amazon will complain about various things like items being out of stock. When this happens, the app will blindly accept default suggestions (by clicking "Continue"). Note: this may cause items to be removed from your cart or substituted if they are no longer in stock.

### Using Amazon Fresh

There is an initial attemp at using Amazon Fresh. The setup process is the same, but requires node 13 or later, since the code uses JS modules.

In addition it uses [Pushover](https://pushover.net) to send you notifications instead of email. Email notifications could be retroffited. You can sign up for a free trial account at Pushover.

After you have signed up for an account and install the app on your phone, create a new app/API integration in Pushover. Then create `config-pushover.json` like so:

```
{
    "user": "user-key",
    "token": "app-token"
}
```

Then run `npm checkout-fresh` or `yarn checkout-fresh`.

This will launch the process of checking Amazon Fresh for a free spot. Once a spot is found, you will get a notification. You will also get a notification every time a check happens and slot was not found.

Adjust the NUM_TRIES and WAIT_BETWEEN_TRIES to suitable numbers.

Once you get a successfull notification, you can finish checking out in the Chrome browser window.

### [Optional] Configure Emailer

To send email notifications when a delivery slot is found, create a `config.json` file with the following structure:

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
