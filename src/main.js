const Apify = require('apify');
const scraper = require('./scraper')

Apify.main(async () => {

    const input = await Apify.getValue('INPUT');
    const launchPuppeteerOptions = input.proxyConfig || {};
    const browser = await Apify.launchPuppeteer(launchPuppeteerOptions);
    const page = await browser.newPage();
    await page.setCookie(...input.initialCookies);
    let requestQueue = [];

    console.log("Starting scraping jobs...")
    for (var i = 0, n = input.handle.length; i < n; i++) {
        const handle = input.handle[i];
        const scraperOpts = {
            browser,
            handle,
            tweetCount: input.tweetsDesired,
        }
        requestQueue.push(scraper.getActivity(scraperOpts).catch(e => console.log(`ERR ${e}`)));
        if (i % 20 === 0) {
          console.log(i);
          await Promise.all(requestQueue)
          .then(result => {
            console.log(result)
          })
          .catch(error => console.log(`Error in executing ${error}`))
        }
    }

    // return await Promise.all(requestQueue)
    // Remaining queue
    await Promise.all(requestQueue)
    .then(result => {
      console.log(result)
    })
    .catch(error => console.log(`Error in executing ${error}`))
})
