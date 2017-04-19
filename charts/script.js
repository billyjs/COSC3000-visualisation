const m = 12;
const n = 20;
const count = n*m;
const single = 100 / count;

$.getJSON(`../scripts/data${n}.json`, function (data) {

    // data formatting code

    let rating = [];
    let months = {};
    let allRatings = ["G", "PG", "M", "MA15+", "R18+", "X18+", "Not Rated", "RC", "NC-17", "SOA", "A", "R", "PG-13", "NRC"];

    data.map((d) => {
        var key = "" + d.year + (Math.floor((d.month-1)/m)*m+Math.floor(m/2));
        if (months[key] === undefined) {
            months[key] = [d];
        } else {
            months[key].push(d);
        }
    });

    Object.keys(months).map((key) => {
        let r = {date: key};
        months[key].map((d) => {
            let rating = (d.rating === undefined) ? "Not Rated" : d.rating;
            r[rating] = (r[rating] === undefined) ? single : r[rating] + single;
            // if (!keys.includes(rating)) {
            //     keys.push(rating);
            // }
        });
        rating.push(r);
    });

    rating = rating.map((r) => {
        allRatings.map((key) => {
            r[key] = (r[key] === undefined) ? 0 : r[key];
        });
        r.M += r["PG-13"];
        r["R18+"] += r.R + r["NC-17"] || 0;
        r["Not Rated"] += r.A + r.SOA;
        r.PG += r.NRC;

        delete r.SOA;
        delete r["NC-17"];
        delete r.NRC;
        delete r.A;
        delete r.R;
        delete r["PG-13"];

        r.date = moment(r.date, "YYYYMM").format("YYYY-MM-DD");

        return r;
    });

    rating = rating.sort((a,b) => {
       if (a.date < b.date) return -1;
       if (a.date > b.date) return 1;
       return 0;
    });

    console.log(rating[20].date);

    // graphing code

    keys = ["G", "PG", "M", "MA15+", "R18+", "X18+", "Not Rated", "RC"];

    var chart = c3.generate({
        bindto: "#chart",
        title: {
            text: "Percentage of each Movie Rating of Popular Movies of each Year"
        },
        padding: {
            right: 20,
            top: 10
        },
        data: {
            x: 'date',
            // xFormat: "%Y-%m",
            json: rating,
            keys: {
                x: 'date',
                value: keys
            },
            type: "area",
            groups: [keys],
            order: (a,b) => {
                let indexA = keys.indexOf(a);
                let indexB = keys.indexOf(b);
                if (indexA < indexB) return -1;
                if (indexA > indexB) return 1;
                return 0;
            }
        },
        axis: {
            x: {
                label: {
                    text: "Year",
                    position: "outer-center"
                },
                type: "timeseries",
                tick: {
                    format: "%Y"
                },
                padding: {
                    left: 0,
                    right: 0
                }

            },
            y: {
                label: {
                    text: "Percentage",
                    position: "outer-middle"
                },
                min: 0,
                max: 100,
                padding: {
                    top: 0,
                    bottom: 0
                }
            }
        },
        tooltip: {
            format: {
                value: function(value, ratio, id) {
                    return value.toFixed(2) + " %";
                }
            }
        }
    });

    resize(chart);
    window.onresize = () => {
        resize(chart);
    }

});

function resize(chart) {
    let size = {height: Math.min(window.innerHeight - 20, 600)};
    chart.resize(size);
}