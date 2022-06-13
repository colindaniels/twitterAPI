const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

require('dotenv').config();

// Pass `handle` as a commandline
const argv = process.argv.slice(2)

console.log(argv)

var handle = argv[0];
var total_tweets = argv[1];
// const handle = 'barackobama';
// const total_tweets = 10;

(async () => {
    const browser = await puppeteer.launch({
        headless: true
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 10000 });

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36')

    var i = 1
    var big_list = []
    await page.on('response', async (r) => {
        if (r.url().startsWith('https://twitter.com/i/api/2/search/adaptive.json')) {



            async function get_tweets_on_page() {
                let response = await r.json()
                let tweets_array = []
                for (let id of Object.keys(response.globalObjects.tweets)) {
                    let tweet = response.globalObjects.tweets[id]
                    tweets_array.push({
                        text: tweet.full_text,
                        date: tweet.created_at
                    })
                }
                tweets_array.forEach((t) => {
                    if (i <= total_tweets) {
                        big_list.push(t)
                        console.log(i)
                        i++
                    }


                })

                if (i <= total_tweets) {
                    await page.waitForSelector('[data-testid="primaryColumn"] section > div > div')
                    await page.evaluate(() => {
                        window.scrollTo(0, document.body.scrollHeight);
                    })

                }
                else {
                    console.log('done')
                    let sorted_by_date_tweets = big_list.sort((a, b) => new Date(b.date) - new Date(a.date));
                    console.log(sorted_by_date_tweets)
                    console.log(sorted_by_date_tweets.length)
                    process.exit()
                }
            }









            get_tweets_on_page()
        }

    })
    await page.goto(`https://twitter.com/search?q=from%3A${handle}%20since%3A2006-03-21&src=typed_query&f=live`, { waitUntil: 'networkidle2' });


    /*

    await page.waitForSelector('article')


    var tweets_obj = {
        tweets: []
    }
    var tweet_ids = []

    var i = 1

    var force_end = false


    async function getTweets() {
        let bodyHTML = await page.evaluate(() => document.body.innerHTML);
        let $ = cheerio.load(bodyHTML)
        let all_tweets = $(bodyHTML).find('[data-testid="primaryColumn"] section > div > div > div')
        let tweets = []
        for (t of all_tweets) {
            // don't allow duplicates
            let id = Number($(t).attr('style').split(' ').at(1).replace('translateY(', '').replace('px);', ''))
            if (!tweet_ids.includes(id) && tweets_obj.tweets.length + tweets.length < total_tweets) {
                let text = $(t).find('[data-testid="tweetText"]').eq(0).text()
                let date = $(t).find('time').attr('datetime')
                let link = $(t).find('[data-testid="card.layoutLarge.media"] a').attr('href')


                if (date !== undefined) {
                    metadata = {
                        handle,
                        text,
                        link,
                        date,
                        id
                    }
                    tweets.push(metadata)
                    console.log(i)
                    i++
                }
                else {
                    if (!$(t).find('div > div > div').html()) {
                        //console.log($(t).html())
                        //force_end = true
                    }
                }


            }
        }

        return tweets
    }
    async function getTweetsAndScroll() {
        //await waitForLoading('[role="progressbar"]')
        if (!force_end) {
            getTweets().then(async (tweets) => {
                tweets.forEach((t) => {
                    // what user sees
                    tweets_obj.tweets.push({
                        handle: t.handle,
                        text: t.text,
                        link: t.link,
                        date: t.date
                    })
                    // add to exclusion array
                    tweet_ids.push(t.id)
                })
                if (tweets_obj.tweets.length < total_tweets) {
                    await scroll()
                    await getTweetsAndScroll()
                }
                else {
                    writeCsv()

                }
            })
        }
        else {
            console.log('FORCE ENDED')
            writeCsv()
        }

    }
    async function scroll() {
        var currentHTML = ''

        await page.evaluate(() => {
            document.querySelector('[data-testid="primaryColumn"] section > div > div > div:last-child').scrollIntoView()
            currentHTML = document.querySelector('[data-testid="primaryColumn"] section > div > div').innerHTML
        })


        await page.waitForFunction(`document.querySelector('[data-testid="primaryColumn"] section > div > div').innerHTML != currentHTML`, { timeout: 5000 }).catch(() => { console.log('timeout') })
        await page.waitForFunction(`Array.from(document.querySelectorAll('[data-testid="primaryColumn"] section > div > div > div')).map(e => Number(e.getAttribute('style').split(' ').at(1).replace('translateY(', '').replace('px);', ''))).includes(${tweet_ids.at(-1)})`, { timeout: 5000 }).catch(() => { console.log('timeout') })

    }
    

    function writeCsv() {
        const csvWriter = createCsvWriter({
            path: `${handle}.csv`,
            header: [
                { id: 'handle', title: 'handle' },
                { id: 'text', title: 'text' },
                { id: 'link', title: 'link' },
                { id: 'date', title: 'date' },
            ]
        });
        const data = tweets_obj.tweets
        //console.log(data)
        csvWriter
            .writeRecords(data)
            .then(() => console.log('The CSV file was written successfully'));
    }
    async function waitForLoading(css_selector) {
        // wait for loader to appear then disapear
        await page.waitForSelector(css_selector, { hidden: false });
        console.log('started')
        await page.waitForSelector(css_selector, { hidden: true });
        console.log('ended')
    }


    getTweetsAndScroll()
*/

})()
