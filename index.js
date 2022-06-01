const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

(async () => {
    const browser = await puppeteer.launch({
        headless: true
    })
    const page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36')

    await page.goto('https://twitter.com/benshapiro', { waitUntil: 'networkidle2' });
    await page.setViewport({ width: 1280, height: 800 });

    await page.waitForSelector('article')

    var tweets_elements = []

    var tweets_obj = {
        tweets: []
    }

    const total_tweets = 51

    async function getTweetsAndScroll() {
        let bodyHTML = await page.evaluate(() => document.body.innerHTML);
        let $ = cheerio.load(bodyHTML)
        let all_tweets = $(bodyHTML).find('article[data-testid="tweet"]')
        all_tweets.each(function() {
            if (!tweets_elements.includes($(this).find('time').attr('datetime')) && tweets_obj.tweets.length < total_tweets) {
                let tweet = $(this).find('[data-testid="tweetText"]').eq(0).text()
                let date = $(this).find('time').attr('datetime')
                tweets_obj.tweets.push({
                    tweet,
                    date
                })
                tweets_elements.push($(this).find('time').attr('datetime'))
            }
        })



        await page.evaluate(() => {
            document.querySelector('nav ~ section > div > div > div:last-child').scrollIntoView()
        })
        //await page.waitForTimeout(3000)
        if (tweets_obj.tweets.length < total_tweets) {
            getTweetsAndScroll()
        }
        else {
            console.log(tweets_obj)
            console.log(tweets_obj.tweets.length)
        }
    }
    getTweetsAndScroll()




})()