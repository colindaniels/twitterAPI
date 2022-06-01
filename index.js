const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

(async () => {
    const browser = await puppeteer.launch({
        headless: true
    })
    const page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36')

    await page.goto('https://twitter.com/TaylourPaige', { waitUntil: 'networkidle2' });
    await page.setViewport({ width: 1280, height: 800 });

    await page.waitForSelector('article')

    var tweets_elements = []

    var tweets_obj = {
        tweets: []
    }

    let i = 0
    async function getTweetsAndScroll() {
        let bodyHTML = await page.evaluate(() => document.body.innerHTML);
        let $ = cheerio.load(bodyHTML)
        let all_tweets = $(bodyHTML).find('[data-testid="tweet"]')
        for (let ii = 0; ii < all_tweets.length; ii++) {

            console.log(!tweets_elements.includes($(all_tweets[ii]).text()))
            if (!tweets_elements.includes($(all_tweets[ii]).text())) {
                let tweet = $(all_tweets[ii]).find('[data-testid="tweetText"]').text()
                let date = $(all_tweets[ii]).find('time').attr('datetime')
                tweets_obj.tweets.push({
                    tweet,
                    date
                })
                tweets_elements.push($(all_tweets[ii]).text())
            }
        }

        await page.evaluate(() => {
            document.querySelector('nav ~ section > div > div > div:last-child').scrollIntoView()
        })
        await page.waitForTimeout(3000)
        i++
        if (i <= 5) {
            getTweetsAndScroll()
        }
        else {
            function hasDuplicates(array) {
                return (new Set(array)).size !== array.length;
            }
            console.log(tweets_obj)
            console.log(hasDuplicates(tweets_obj.tweets))
        }
    }
    getTweetsAndScroll()




})()