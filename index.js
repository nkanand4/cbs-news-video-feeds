var http = require('./main'),
    fs = require('fs'),
    jsdom = require('jsdom'),
    jquery = fs.readFileSync("./jquery.js").toString(),
    defer = require("node-promise").defer,
    categories = ['cbs-this-morning', 'evening-news'];



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
        hostname: 'www.cbsnews.com',
        port: 80,
        path: '/videos/topics/'+playlistType+'/',
        method: 'GET'
    });
    return getPlaylistVideoPages(request);
}

function get() {
    fetchPlaylist(categories[1]).then(function(list) {
        console.log(list);
    });
}

get();