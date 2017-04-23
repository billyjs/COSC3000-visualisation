const n = 20;

let chart = undefined;

// define color lists
let color10 = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
let color20 = ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'];

$.getJSON(`./data/pop-data${n}.json`, function (json) {

    // process genre data
    let genre = genreData(json);
    let genreKeys = ["Drama", "Comedy", "Action", "Romance", "Crime", "Horror", "Thriller", "Adventure", "Mystery", "Sci-Fi", "Fantasy", "Family", "Biography", "Western", "Animation", "Other"];
    let genreTitle = "Percentage of each Genre of Popular Movies of each Year";

    // show genre chart
    chart = areaChart(genre, genreKeys, color20, genreTitle);
    resize(chart);

    // process rating data
    let rating = ratingData(json);
    let ratingKeys = ["G", "PG", "M", "MA15+", "R18+", "X18+", "Not Rated", "RC"];
    let ratingTitle = "Percentage of each Movie Rating of Popular Movies of each Year";

    // process gross data
    let gross = grossData(json);

    // process runtime data
    let runtime = runtimeData(json);

    // set 'Gross FFT' button to show gross fft chart
    $.getJSON('./data/grossfft.json', (grossfft) => {
        $("#grossfft").click(() => {
            chart = grossFFTChart(grossfft);
            resize(chart);
        });
    });

    // set 'Genre' button to show genre chart
    $("#genre").click(() => {
        chart = areaChart(genre, genreKeys, color20, genreTitle);
        resize(chart);
    });

    // set 'Rating' button to show rating chart
    $("#rating").click(() => {
        chart = areaChart(rating, ratingKeys, color10, ratingTitle);
        resize(chart);
    });

    // set 'Gross' button to show gross chart
    $("#gross").click(() => {
        chart = grossChart(gross);
        resize(chart);
    });

    // set 'Runtime' button to show runtime chart
    $("#runtime").click(() => {
        chart = runtimeChart(runtime);
        resize(chart);
    });

});

function runtimeChart(data) {
    return c3.generate({
        bindto: "#chart",
        title: {
            text: "Average Runtime of Popular Movies each Month"
        },
        padding: {
            right: 20,
            top: 10
        },
        data: {
            x: 'date',
            json: data,
            keys: {
                x: 'date',
                value: ['runtime', "poly3",]
            },
            type: "line",
            groups: [["gross"], ['poly3']],
        },
        axis: {
            x: {
                label: {
                    text: "Date (Year/Month)",
                    position: "outer-center"
                },
                type: "timeseries",
                tick: {
                    format: "%Y/%m"
                },
                padding: {
                    left: 0,
                    right: 0
                }

            },
            y: {
                label: {
                    text: "Runtime (mins)",
                    position: "outer-middle"
                },
                min: 80,
                max: 130,
                padding: {
                    top: 0,
                    bottom: 0
                }
            }
        },
        tooltip: {
            format: {
                value: function(value) {
                    return parseInt(value) + " mins";
                }
            }
        },
    });
};

function runtimeData(json) {
    let data = [];
    let groups = {};

    json.map((d) => {
        let key = "" + d.year + d.month;
        if (groups[key] === undefined) {
            groups[key] = [d];
        } else {
            groups[key].push(d);
        }
    });

    Object.keys(groups).forEach((key) => {
        let g = { date: key };
        groups[key].map((d) => {
            if (d.runtime === undefined || d.runtime === null || d.runtime > 300) {
                g["zeros"] = (g["zeros"] === undefined) ? 1 : g["zeros"] + 1;
            } else {
                g["runtime"] = (g["runtime"] === undefined) ? d.runtime : g["runtime"] + d.runtime;
            }
        });
        data.push(g);
    });

    data = data.map((d) => {
        d.date = moment(d.date, "YYYYMM").format("YYYY-MM-DD");
        return d;
    }).sort((a,b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return 0;
    }).map((d) => {
        let count = (d.zeros === undefined) ? 20 : 20 - d.zeros;
        d.runtime = parseInt(d.runtime/count);
        return d;
    });

    let points = data.map((d, i) => {
        return [i, d.runtime];
    });


    /*
     create a cubic best fit for the data points.
     cubic was determined as the best fit by using regression and minimising the fit measure.
     fit measures:
        - linear:       27.1863
        - quadratic:    27.1266
        - cubic:        26.8117
        - quartic:      26.8984
      */
    // var reg = regression('linear', points);
    // var reg2 = regression('polynomial', points, 2);
    var reg3 = regression('polynomial', points, 3);
    // var reg4 = regression('polynomial', points, 4);

    data = data.map((d, i) => {
        // d.linear = reg.equation[0] * i + reg.equation[1];
        // d.poly2 = reg2.equation[0] + reg2.equation[1] * i + reg2.equation[2] * i * i;
        d.poly3 = reg3.equation[0] + reg3.equation[1] * i + reg3.equation[2] * i * i + reg3.equation[3] * i * i * i;
        // d.poly4 = reg4.equation[0] + reg4.equation[1] * i + reg4.equation[2] * i * i + reg4.equation[3] * i * i * i + reg4.equation[4] * i * i * i * i;
        return d;
    });

    // let ssq = data.reduce((total, d) => {
    //     return total + Math.pow(d.runtime-d.linear,2);
    // }, 0);
    //
    // console.log(ssq/(data.length - 4));
    //
    // let ssq2 = data.reduce((total, d) => {
    //     return total + Math.pow(d.runtime-d.poly2,2);
    // }, 0);
    //
    // console.log(ssq2/(data.length - 6));
    //
    // let ssq3 = data.reduce((total, d) => {
    //     return total + Math.pow(d.runtime-d.poly3,2);
    // }, 0);
    //
    // console.log(ssq3/(data.length - 8));
    //
    // let ssq4 = data.reduce((total, d) => {
    //     return total + Math.pow(d.runtime-d.poly4,2);
    // }, 0);
    //
    // console.log(ssq4/(data.length - 10));
    //
    // console.log(reg, reg2, reg3, reg4);

    return data;
}

function grossFFTChart(data) {
    return c3.generate({
        bindto: "#chart",
        title: {
            text: "!Gross FFT?"
        },
        padding: {
            right: 20,
            top: 10
        },
        data: {
            x: 'freq',
            json: data,
            keys: {
                x: 'freq',
                value: ['P1']
            },
            type: "line",
            groups: [["P1"]],
        },
        axis: {
            x: {
                label: {
                    text: "Frequency (1/Month)",
                    position: "outer-center"
                },
                padding: {
                    left: 0,
                    right: 0
                }

            },
            y: {
                label: {
                    text: "Million Dollars ($M)",
                    position: "outer-middle"
                },
                tick: {
                    format: (val) => {
                        return val / 1000000;
                    }
                },
                min: 0,
                padding: {
                    top: 0,
                    bottom: 0
                }
            }
        },
        point: {
            r: 2
        }
    });
}

function grossChart(data) {
    return c3.generate({
        bindto: "#chart",
        title: {
            text: "Monthly Grossing of Popular Movies"
        },
        padding: {
            right: 20,
            top: 10
        },
        data: {
            x: 'date',
            json: data,
            keys: {
                x: 'date',
                value: ['gross', "poly2"]
            },
            type: "line",
            groups: [["gross"], ["poly2"]],
        },
        axis: {
            x: {
                label: {
                    text: "Date (Year/Month)",
                    position: "outer-center"
                },
                type: "timeseries",
                tick: {
                    format: "%Y/%m"
                },
                padding: {
                    left: 0,
                    right: 0
                }

            },
            y: {
                label: {
                    text: "Million Dollars ($M)",
                    position: "outer-middle"
                },
                tick: {
                    format: (val) => {
                        return val / 1000000;
                    }
                },
                min: 0,
                padding: {
                    top: 0,
                    bottom: 0
                }
            }
        },
        tooltip: {
            format: {
                value: function(value) {
                    return "$" + parseInt(value/1000000) + " M";
                }
            }
        },
    });
}

function grossData(json) {
    let data = [];
    let groups = {};

    json.map((d) => {
        let key = "" + d.year + d.month;
        if (groups[key] === undefined) {
            groups[key] = [d];
        } else {
            groups[key].push(d);
        }
    });

    Object.keys(groups).forEach((key) => {
        let g = { date: key };
        groups[key].map((d) => {
            if (d.gross === undefined) {
                g["zeros"] = (g["zeros"] === undefined) ? 1 : g["zeros"] + 1;
            } else {
                g["gross"] = (g["gross"] === undefined) ? d.gross : g["gross"] + d.gross;
            }
        });
        data.push(g);
    });

    data = data.map((d) => {
        d.date = moment(d.date, "YYYYMM").format("YYYY-MM-DD");
        return d;
    }).filter((d) => {
        return d.date >= "1986-01"; // grossing data before 1986 kinda messed up
    }).sort((a,b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return 0;
    });

    let points = data.map((d, i) => {
        return [i, d.gross];
    });
    /*
     create a quadratic best fit for the data points.
     quadratic was determined as the best fit by using regression and minimising the fit measure.
     fit measures:
     - linear:       63536211448469130
     - quadratic:    63132732033583100
     - cubic:        63252947607479320
     - quartic:      63555896684423080
     */
    // var reg = regression('linear', points);
    var reg2 = regression('polynomial', points, 2);
    // var reg3 = regression('polynomial', points, 3);
    // var reg4 = regression('polynomial', points, 4);

    data = data.map((d, i) => {
        // d.linear = reg.equation[0] * i + reg.equation[1];
        d.poly2 = reg2.equation[0] + reg2.equation[1] * i + reg2.equation[2] * i * i;
        // d.poly3 = reg3.equation[0] + reg3.equation[1] * i + reg3.equation[2] * i * i + reg3.equation[3] * i * i * i;
        // d.poly4 = reg4.equation[0] + reg4.equation[1] * i + reg4.equation[2] * i * i + reg4.equation[3] * i * i * i + reg4.equation[4] * i * i * i * i;
        return d;
    });

    // let ssq = data.reduce((total, d) => {
    //     return total + Math.pow(d.gross-d.linear,2);
    // }, 0);
    //
    // console.log(ssq/(data.length - 4));
    //
    // let ssq2 = data.reduce((total, d) => {
    //     return total + Math.pow(d.gross-d.poly2,2);
    // }, 0);
    //
    // console.log(ssq2/(data.length - 6));
    //
    // let ssq3 = data.reduce((total, d) => {
    //     return total + Math.pow(d.gross-d.poly3,2);
    // }, 0);
    //
    // console.log(ssq3/(data.length - 8));
    //
    // let ssq4 = data.reduce((total, d) => {
    //     return total + Math.pow(d.gross-d.poly4,2);
    // }, 0);
    //
    // console.log(ssq4/(data.length - 10));
    //
    // console.log(reg, reg2, reg3, reg4);
    //
    // console.log(data);

    return data;
}

function genreData(json) {
    const m = 12;
    const count = n*m;

    let data = [];
    let groups = {};
    let genres = ["Drama", "Comedy", "Action", "Romance", "Crime", "Horror", "Thriller", "Adventure", "Mystery", "Sci-Fi", "Fantasy", "Family", "Biography", "Western", "Animation", "Other"];

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
        /*
        Rating groupings:
            PG-13 added to M
            R and NC-17 added to R18+
            A and SOA added to Not Rated
            NRC added to PG
         */
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
            json: data,
            keys: {
                x: 'date',
                value: keys
            },
            type: "area",
            groups: [keys],
            order: false
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