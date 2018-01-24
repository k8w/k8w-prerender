const express = require('express');
var app = express();
const log4js = require('log4js');
const path = require('path');
const phantomjs = require('phantomjs-prebuilt');
const phantomPath = phantomjs.path;

let logPath = process.env['NODE_ENV'] === 'production' ? '/var/log/prerender' : path.resolve('.', 'log')
const port = 3333;

// 引入NodeJS的子进程模块
var child_process = require('child_process');

log4js.configure({
    appenders: [
        {
            type: 'console'
        },
        {
            type: 'dateFile',
            filename: logPath,
            pattern: '-yyyy-MM-dd',
            alwaysIncludePattern: true
        }
    ],
    replaceConsole: true
});

console.log('phantomPath: ' + phantomPath);

app.get('*', function (req, res) {
    // 完整URL
    var url = req.protocol + '://' + req.hostname + req.originalUrl;

    //TEST
    // var url = req.query.url;
    // if(!url){
    // 	return;
    // }

    var userAgent = req.get('User-Agent');
    console.info('URL=' + url, 'User-Agent=' + userAgent);

    //计时
    res.startTime = Date.now();

    // 开启一个phantomjs子进程
    var phantom = child_process.spawn(phantomPath, ['spider.js', url]);
    var output = '';

    // 设置stdout字符编码
    phantom.stdout.setEncoding('utf8');

    // 监听phantomjs的stdout，并拼接起来
    phantom.stdout.on('data', function (data) {
        let temp = data.toString();
        if (temp.startsWith('[PhantomJS Error]')) {
            console.warn(temp);
        }
        else {
            output += temp;
        }
    });

    // 监听子进程退出事件
    phantom.on('exit', function (code) {
        switch (code) {
            case 1:
                console.error('加载失败');
                break;
            case 2:
                console.error('加载超时: ' + url);
                break;
        }

        let result = output
            .replace(/<script[\s\S]*?<\/script>/g, '')	//移除JS
            //.replace(/<img src="data:.*?>/g, '')	//移除Base64 Image
            //.replace(/<style[\s\S]*?<\/style>/g, '')	//移除Style
            .replace(/<!--[\s\S]*?-->/g, '')	//移除HTML注释

        res.send(result);
        console.log('Done', 'ResultLength=' + result.length, 'TimeUsed=' + (Date.now() - res.startTime) + 'ms');
    });

});
app.listen(port, e => {
    console.info("server running at port")
})