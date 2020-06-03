const Apify = require('apify');
const scraper = require('./scraper')

Apify.main(async () => {

    const input = await Apify.getValue('INPUT');
    const launchPuppeteerOptions = input.proxyConfig || {};
    const browser = await Apify.launchPuppeteer(launchPuppeteerOptions);
    const page = await browser.newPage();
    await page.setCookie(...input.initialCookies);
    let requestQueue = [];

    for (var i = 0, n = input.handle.length; i < n; i++) {
        const handle = input.handle[i];
        const scraperOpts = {
            browser,
            handle,
            tweetCount: input.tweetsDesired,
        }
        requestQueue.push(scraper.getActivity(scraperOpts).catch(e => console.log(`ERR ${e}`)));
    }

    console.log("Starting scraping jobs...")

    function parallelLimit(promiseFactories, limit) {
      let result = [];
      let cnt = 0;
      function chain(promiseFactories) {
        if(!promiseFactories.length) return;
        let i = cnt++; // preserve order in result
        return promiseFactories.shift()().then((res) => {
          result[i] = res; // save result
          return chain(promiseFactories); // append next promise
        });
      }
      let arrChains = [];
      while(limit-- > 0 && promiseFactories.length > 0) {
        // create `limit` chains which run in parallel
        arrChains.push(chain(promiseFactories));
      }
      // return when all arrChains are finished
      return Promise.all(arrChains).then(() => result);
    }
    parallelLimit(requestQueue, 4).then(console.log);

    // return await Promise.all(requestQueue)
    // await Promise.all(requestQueue)
    // .then(result => {
    //   console.log(result)
    //   return result
    // })
    // .catch(error => console.log(`Error in executing ${error}`))
})
