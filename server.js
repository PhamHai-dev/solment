const http = require('http');
const url = require('url');
const handler = require('./api/tinh-gia');

const server = http.createServer((req, res) => {
    // Cho phép CORS khi test local
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Mock Express-like res.status() và res.json() mà Vercel cung cấp
    res.status = (statusCode) => {
        res.statusCode = statusCode;
        return res;
    };
    res.json = (data) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data, null, 2));
    };

    // Phân tích query string cho phương thức GET
    const parsedUrl = url.parse(req.url, true);
    req.query = parsedUrl.query || {};

    // Phân tích body cho phương thức POST
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        if (body) {
            try {
                req.body = JSON.parse(body);
            } catch (e) {
                req.body = {};
            }
        } else {
            req.body = {};
        }
        
        // Gọi thẳng hàm xử lý của Vercel
        handler(req, res);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`[🚀] Local Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`[👉] Endpoint API: POST http://localhost:${PORT}/api/tinh-gia`);
    console.log(`Bạn có thể mở Postman để bắn Request vào URL trên.`);
});
