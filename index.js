const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const cliProgress = require('cli-progress');
const colors = require('ansi-colors');
const fs = require('fs');
process.setMaxListeners(0);


require('dotenv').config();



const argv = process.argv.slice(2);
const handles_file = argv[0];
const total_tweets = argv[1];

const handles_list = fs.readFileSync(handles_file, "utf8").split('\n').slice(1)

const bar1 = new cliProgress.SingleBar({
    format: 'Progress |' + colors.green('{bar}') + '| {percentage}% || {value}/{total} Expected Tweets',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591'
});
bar1.start(total_tweets * handles_list.length, 0);


function getTweetsFromHandle(handle) {
    return new Promise(async (resolve, reject) => {
        let i = 1
        let user_id = ''
        let big_list = []
        let browser = await puppeteer.launch({
            headless: true
        })
        let page = await browser.newPage()
        await page.setViewport({ width: 1280, height: 1000 });
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36')


        page.on('response', async (r) => {
            if (r.url().startsWith('https://twitter.com/i/api/2/search/adaptive.json')) {
                let response = await r.json()
                if (Object.keys(response.globalObjects.tweets).length !== 0) {
                    let tweets_array = []
                    for (let id of Object.keys(response.globalObjects.tweets)) {
                        let tweet = response.globalObjects.tweets[id]
                        tweets_array.push({
                            text: tweet.full_text,
                            date: tweet.created_at,
                            user_id: tweet.user_id_str
                        })

                    }
                    tweets_array.sort((a, b) => new Date(b.date) - new Date(a.date));


                    if (i == 1) {
                        user_id = tweets_array[0].user_id
                    }


                    tweets_array.forEach(async (t) => {
                        if (i <= total_tweets) {
                            if (t.user_id == user_id) {
                                big_list.push(t)
                                bar1.increment()

                                i++
                            }


                        }
                        else {
                            resolve(big_list)
                        }

                    })
                }
                else {
                    resolve(big_list)
                }






            }
        })
        let url = `https://twitter.com/search?q=from%3A${handle}%20since%3A2006-03-21&src=typed_query&f=live`
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
        await page.evaluate(() => {
            setInterval(() => {
                window.scrollTo(0, document.body.scrollHeight);
            }, 50)
        })


    })
}
handles_list.forEach((h, ii) => {
    getTweetsFromHandle(h).then((all) => {
        writeCsv(all, h).then(() => {
            if (ii + 1 == handles_list.length) {
                process.exit()
            }
        })

    })
})



async function writeCsv(data, h) {

    var csvWriter = createCsvWriter({
        path: `output/${h}.csv`,
        header: [
            { id: 'text', title: 'text' },
            { id: 'date', title: 'date' }
        ]
    });
    await csvWriter.writeRecords(data)
}
