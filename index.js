const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

(async () => {
    const browser = await puppeteer.launch({
        headless: true
    })
    const page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36')

    await page.goto('https://twitter.com/leadermcconnell', { waitUntil: 'networkidle2' });
    await page.setViewport({ width: 1280, height: 50000 });
    await page.waitForFunction(
        '(() => { for (let e of document.querySelectorAll("time")) { if (e.textContent.includes("Jun")) { return true } } })()',
        { timeout: 0 }
    )
    let bodyHTML = await page.evaluate(() => document.body.innerHTML);
    const $ = cheerio.load(bodyHTML)
    const tweets_html = $('[data-testid="tweet"]')
    const total_tweets = tweets_html.length
    tweets_obj = {
        tweets: [],
        total_tweets
    }
    tweets_html.each(function() {
        const tweetText = $(this).find('[data-testid="tweetText"]').text()
        const tweetDate = $(this).find('time').attr('datetime')
        tweets_obj.tweets.push({
            tweetText,
            tweetDate
        })
    })
    console.log(tweets_obj)
})()