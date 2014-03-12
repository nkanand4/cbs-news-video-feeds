var domain = 'www.cbsnews.com',
    http = require('./main'),
    fs = require('fs'),
    jsdom = require('jsdom'),
    jquery = fs.readFileSync("./jquery.js").toString(),
    defer = require("node-promise").defer,
    categories = ['cbs-this-morning', 'evening-news', '60-minutes', '48-hours'];



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

function get() {
    fetchPlaylist(categories[2]).then(pushToJSONArray);

    function pushToJSONArray(list) {
        list.forEach(function(item) {
            http.request({
                hostname: domain,
                method: 'GET',
                path: item + '/'
            }).then(function(response) {
                jsdom.env(response, ["http://code.jquery.com/jquery.js"], function(error, win) {
                    var $ = win.jQuery;
                    var state = JSON.parse($('#container-video').attr('data-cbsvideoui-options')).state;
                    var data = {
                        title: state.title,
                        url: state.video.image.full,
                        video: state.video.medias.tablet.uri
                    };
                    console.log('info', data);
                });
            });
        });
    }
}

get();