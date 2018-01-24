/*global phantom*/
"use strict";

// 单个资源等待时间，避免资源加载后还需要加载其他资源
var resourceWait = 200;
var resourceWaitTimer;

// 最大等待时间
var maxWait = 5000;
var maxWaitTimer;

// 资源计数
var resourceCount = 0;

// PhantomJS WebPage模块
var page = require('webpage').create();

// NodeJS 系统模块
var system = require('system');

// 从CLI中获取第二个参数为目标URL
var url = system.args[1];

// 设置PhantomJS视窗大小
page.viewportSize = {
    width: 1280,
    height: 560
};

// 获取镜像
var capture = function(errCode){

    // 外部通过stdout获取页面内容
    console.log(page.content);

    // 清除计时器
    clearTimeout(maxWaitTimer);

    // 任务完成，正常退出
    phantom.exit(errCode);

};

function checkResourceCount(){
    if (resourceCount === 0){

        // 当页面中全部资源都加载完毕后，截取当前渲染出来的html
        // 由于onResourceReceived在资源加载完毕就立即被调用了，我们需要给一些时间让JS跑解析任务
        // 这里默认预留500毫秒
        clearTimeout(resourceWaitTimer);
        resourceWaitTimer = setTimeout(capture, resourceWait);

    }
}

// 资源请求并计数
page.onResourceRequested = function(requestData, networkRequest){
    if(/(baidu\.com)|jiathis/.test(requestData.url)  //网站统计不加载
        || /\.(png|jpg|jpeg|gif|css|ico|svg|ttf|eot|woff)$/.test(requestData.url)    //静态资源不加载
    ){
        networkRequest.abort();
    }
    else{
        resourceCount++;
        clearTimeout(resourceWaitTimer);
    }
};

// 资源加载完毕
page.onResourceReceived = function (res) {
    // chunk模式的HTTP回包，会多次触发resourceReceived事件，需要判断资源是否已经end
    if (res.stage !== 'end' || !res.url){
        return;
    }

    resourceCount--;
    checkResourceCount();
};

// 资源加载超时
page.onResourceTimeout = function(req){

};

// 资源加载失败
page.onResourceError = function(err){
    if(err.url){
        console.log("[PhantomJS Error]", '[onResourceError]', JSON.stringify(err));
    }
};

page.onError = function(msg){
    console.log("[PhantomJS Error]"+msg);
}

// 打开页面
page.open(url, function (status) {
    if (status !== 'success') {
        phantom.exit(1);
    } else {
        // 当改页面的初始html返回成功后，开启定时器
        // 当到达最大时间（默认5秒）的时候，截取那一时刻渲染出来的html
        maxWaitTimer = setTimeout(function(){

            capture(2);

        }, maxWait);

    }

});