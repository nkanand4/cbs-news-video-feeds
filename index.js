var domain = 'www.cbsnews.com',
    http = require('./main'),
    fs = require('fs'),
    jsdom = require('jsdom'),
    jquery = fs.readFileSync("./jquery.js").toString(),
    defer = require("node-promise").defer,
    category = 'cbs-this-morning',
    m3u = [];
    // dummy data
    // 'cbs-this-morning', 'evening-news', '60-minutes', '48-hours'


function getPlaylistVideoPages(request) {
    var dfd = defer();
    request.then(function(html) {
        jsdom.env(html, ["http://code.jquery.com/jquery.js"], function(errors, win) {
            var $ = win.jQuery;
            var playlist = $('.playlist li a');
            var hrefs = [];
            playlist.each(function(t) {
                hrefs.push($(this).attr('href'));
            });
            dfd.resolve(hrefs);
        });
    }, function(e) {
        dfd.reject(e);
    });
    return dfd;
}

function fetchPlaylist(playlistType) {
    var request = http.request({
        hostname: domain,
        port: 80,
        path: '/videos/topics/'+playlistType+'/',
        method: 'GET'
    });
    return getPlaylistVideoPages(request);
}

function get(category) {
    var total = 0;
    fetchPlaylist(category).then(pushToJSONArray);

    function pushToJSONArray(list) {
        total = list.length;
        list.forEach(function(item) {
            http.request({
                hostname: domain,
                method: 'GET',
                path: item + '/'
            }).then(function(response) {
                jsdom.env(response, ["http://code.jquery.com/jquery.js"], function(error, win) {
                    var state = JSON.parse(win.$('#container-video').attr('data-cbsvideoui-options')).state;
                    var device = state.video.medias.tablet ?
                                    state.video.medias.tablet : state.video.medias.mobile ? state.video.medias.mobile : state.video.medias.ios;
                    if(device) {
                        m3u.push({
                            title: state.title,
                            url: state.video.image.full,
                            video: device.uri
                        });
                    }

                    total -= 1;
                    if(total === 0) {
                        writeToFile();
                    }
                });
            });
        });
    }
}

function writeToFile() {
    var data = {
        playlist : m3u
    };
    console.log(JSON.stringify(data));
}

if(typeof process.argv[2] !== 'undefined') {
    category = process.argv[2];
}
get(category);