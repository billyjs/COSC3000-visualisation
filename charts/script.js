const n = 20;

let chart = undefined;

$.getJSON(`../scripts/data${n}.json`, function (json) {

    let color10 = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
    let color20 = ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'];

    let genre = genreData(json);
    let genreKeys = ["Drama", "Comedy", "Action", "Romance", "Crime", "Horror", "Thriller", "Adventure", "Mystery", "Sci-Fi", "Fantasy", "Family", "Biography", "Western", "Animation", "Other"];
    let genreTitle = "Percentage of each Genre of Popular Movies of each Year";

    let rating = ratingData(json);
    let ratingKeys = ["G", "PG", "M", "MA15+", "R18+", "X18+", "Not Rated", "RC"];
    let ratingTitle = "Percentage of each Movie Rating of Popular Movies of each Year";

    chart = areaChart(genre, genreKeys, color20, genreTitle);
    // chart = areaChart(rating, ratingKeys, color10, ratingTitle);

    $("#genre").click(() => {
        chart = areaChart(genre, genreKeys, color20, genreTitle);
        resize(chart);
    });

    $("#rating").click(() => {
        chart = areaChart(rating, ratingKeys, color10, ratingTitle);
        resize(chart);
    });

    resize(chart);

});

function genreData(json) {
    const m = 12;
    const count = n*m;

    let data = [];
    let groups = {};
    let genres = ["Drama", "Comedy", "Action", "Romance", "Crime", "Horror", "Thriller", "Adventure", "Mystery", "Sci-Fi", "Fantasy", "Family", "Biography", "Western", "Animation", "Other"];
    //let genres = ["Action", "Adult", "Adventure", "Animation", "Biography", "Comedy", "Crime", "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Musical", "Mystery", "News", "No Genre", "Romance", "Sci-Fi", "Sport", "Thriller", "War", "Western"];

    json.map((d) => {
        let key = "" + d.year + (Math.floor((d.month-1)/m)*m+Math.floor(m/2));
        if (groups[key] === undefined) {
            groups[key] = [d];
        } else {
            groups[key].push(d);
        }
    });

    Object.keys(groups).forEach((key) => {
        let g = { date: key };
        groups[key].map((d) => {
            let length = d.genres.length;
            let single = 100 / (count * length);
            d.genres.forEach((genre) => {
                genre = (!genres.includes(genre)) ? "Other" : genre;
                g[genre] = (g[genre] === undefined) ? single : g[genre] + single;
            });
        });
        data.push(g);
    });

    // var test = [];
    // genres.forEach((genre) => {
    //     var total = 0;
    //     data.forEach((d) => {
    //         var v = (d[genre] === undefined) ? 0 : d[genre];
    //         total += v;
    //     });
    //     test.push({
    //         genre: genre,
    //         val: total/50
    //     });
    // });
    // test = test.sort((a,b) => {
    //     if (a.val < b.val) return -1;
    //     if (a.val > b.val) return 1;
    //     return 0;
    // });
    // console.log(test);

    return data.map((d) => {
        genres.map((key) => {
            d[key] = (d[key] === undefined) ? 0 : d[key];
        });
        d.date = moment(d.date, "YYYYMM").format("YYYY-MM-DD");
        return d;
    }).sort((a,b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return 0;
    });

}

function ratingData(json) {
    const m = 12;
    const count = n*m;
    const single = 100 / count;

    let rating = [];
    let groups = {};
    let allRatings = ["G", "PG", "M", "MA15+", "R18+", "X18+", "Not Rated", "RC", "NC-17", "SOA", "A", "R", "PG-13", "NRC"];

    json.map((d) => {
        let key = "" + d.year + (Math.floor((d.month-1)/m)*m+Math.floor(m/2));
        if (groups[key] === undefined) {
            groups[key] = [d];
        } else {
            groups[key].push(d);
        }
    });

    Object.keys(groups).map((key) => {
        let r = {date: key};
        groups[key].map((d) => {
            let rating = (d.rating === undefined) ? "Not Rated" : d.rating;
            r[rating] = (r[rating] === undefined) ? single : r[rating] + single;
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

    return rating.sort((a,b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return 0;
    });
}

function areaChart(data, keys, colors, title) {
    return c3.generate({
        bindto: "#chart",
        title: {
            text: title
        },
        padding: {
            right: 20,
            top: 10
        },
        data: {
            x: 'date',
            // xFormat: "%Y-%m",
            json: data,
            keys: {
                x: 'date',
                value: keys
            },
            type: "area",
            groups: [keys],
            order: false
            // order: (a,b) => {
            //     let indexA = keys.indexOf(a);
            //     let indexB = keys.indexOf(b);
            //     if (indexA < indexB) return -1;
            //     if (indexA > indexB) return 1;
            //     return 0;
            // }
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
                value: function(value) {
                    return value.toFixed(2) + " %";
                }
            }
        },
        color: {
            pattern: colors
        }
    });
}

function resize(chart) {
    if (chart !== undefined) {
        let size = {height: Math.min(window.innerHeight - 80, 600)};
        chart.resize(size);
    }
}

window.onresize = () => {
    resize(chart);
};