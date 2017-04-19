const async = require('async');
const moment = require('moment');
const fs = require('fs');
const Progress = require('progress');
const Xray = require('x-ray');
const x = Xray({
    filters: {
        trim: (value) => {
            return typeof value === 'string' ? value.trim() : value
        },
        split: (value, index, sep = " ") => {
            return typeof value === 'string' ? value.split(sep)[index] : value
        },
        arr: (value, sep = ", ") => {
            return typeof value === 'string' ? value.split(sep) : value
        },
        num: (value) => {
            return typeof value === 'string' ? parseInt(value.replace(/,/g, '')) : value
        }
    }
});

const base = 'http://www.imdb.com/search/title';
const count = 20;
const sort = 'boxoffice_gross_us';
const title_type = 'feature';
const limit = 20;

let pages = [];

// 1967 - 2017
for (let year = 1967; year < 2017; year++) {
    for (let month = 1; month < 13; month++) {

        let date = moment(`${year}-${month}`, 'YYYY-MM');
        let start = date.startOf('month').format('YYYY-MM-DD');
        let end = date.endOf('month').format('YYYY-MM-DD');

        let url = `${base}?count=${count}&release_date=${start},${end}&sort=${sort}&title_type=${title_type}`;
        pages.push({
            url: url,
            year: year,
            month: month
        });
    }
}

let bar = new Progress("Scraping [:bar] :percent", { total: pages.length, width: 20 });

async.mapLimit(pages, limit, load, (err, results) => {
    if (err) {
        console.error(err);
    } else {
        results = [].concat.apply([], results);
        write(results);
    }
});

function load(page, callback) {
    x(page.url, '.lister-item', [{
        title: '.lister-item-header a',
        rating: '.certificate',
        runtime: '.runtime | split:0 | num',
        genres: '.genre | trim | arr',
        gross: '.sort-num_votes-visible span:nth-of-type(5)@data-value | num'
    }])((err, result) => {
        if (err) callback(err);
        if (result === undefined) callback("undefined result from xray");

        result = result.map((value) => {
            value.year = page.year;
            value.month = page.month;
            return value;
        });

        // data.push(...result);
        bar.tick();
        callback(null, result);
    });
}

function write(data) {
    fs.writeFile(`_data_${count}.json`, JSON.stringify(data), (err) => {
        if (err) console.error(err);
    });
}