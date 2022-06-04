const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
require('dotenv').config();

(async () => {
    const browser = await puppeteer.launch({
        headless: true
    })
    const page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36')

    await page.goto('https://twitter.com/search?q=from%3Abenshapiro%20since%3A2006-03-21&src=typed_query&f=live', { waitUntil: 'networkidle2' });
    await page.setViewport({ width: 1280, height: 800 });


    await page.waitForSelector('article')


    var tweets_obj = {
        tweets: []
    }
    var tweet_ids = []

    const total_tweets = 100

    async function getTweets() {
        let bodyHTML = await page.evaluate(() => document.body.innerHTML);
        let $ = cheerio.load(bodyHTML)
        let all_tweets = $(bodyHTML).find('[data-testid="primaryColumn"] section > div > div > div')
        let tweets = []
        all_tweets.each(function () {
            // don't allow duplicates
            let id = Number($(this).attr('style').split(' ').at(1).replace('translateY(', '').replace('px);', ''))
            if (!tweet_ids.includes(id) && tweets_obj.tweets.length + tweets.length < total_tweets) {
                let text = $(this).find('[data-testid="tweetText"]').eq(0).text()
                let date = $(this).find('time').attr('datetime')
                metadata = {
                    text,
                    date,
                    id
                }
                tweets.push(metadata)
            }
        })
        return tweets
    }
    function getTweetsAndScroll() {
        console.log('i')
        getTweets().then(async (tweets) => {
            tweets.forEach((t) => {
                // what user sees
                tweets_obj.tweets.push({
                    text: t.text,
                    date: t.date
                })
                // add to exclusion array
                tweet_ids.push(t.id)
            })
            if (tweets_obj.tweets.length < total_tweets) {
                var currentHTML = ''
                await page.evaluate((ids) => {
                    document.querySelector('[data-testid="primaryColumn"] section > div > div > div:last-child').scrollIntoView()
                    currentHTML = document.querySelector('[data-testid="primaryColumn"] section > div > div').innerHTML
                }, tweet_ids)
                await page.waitForFunction(`document.querySelector('[data-testid="primaryColumn"] section > div > div').innerHTML != currentHTML`)
                await page.waitForFunction(`Array.from(document.querySelectorAll('[data-testid="primaryColumn"] section > div > div > div')).map(e => Number(e.getAttribute('style').split(' ').at(1).replace('translateY(', '').replace('px);', ''))).includes(${tweet_ids.at(-1)})`)
                await getTweetsAndScroll()
            }
            else {
                console.log(tweets_obj)
                console.log(tweets_obj.tweets.length)
                console.log(tweet_ids)
            }
        })
    }
    getTweetsAndScroll()

    /*

    //

let lst = []
document.querySelectorAll('[data-testid="primaryColumn"] section > div > div > div').forEach((e) => { lst.push(Number(e.getAttribute('style').split(' ').at(1).replace('translateY(', '').replace('px);', ''))) })
console.log(lst)

*/



})()

