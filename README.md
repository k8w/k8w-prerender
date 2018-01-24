phantomjs做SEO
-------------
### 适用
1. 单页应用
2. 首页源码没有完整的HTML

### 使用

```
npm install
npm start
```

### nginx配置
```
location / {    	
    if ($http_user_agent ~* spider|bot) {
        proxy_pass http://localhost:3333;
        break;
    }
    
    # 原来的配置
    # root /xxx/xxxx;
}
```