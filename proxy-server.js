const cors_proxy = require('cors-anywhere');

const host = '127.0.0.1';
const port = 8080;

cors_proxy.createServer({
    originWhitelist: ['https://127.0.0.1:5500'], // Whitelist your development server
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2'],
    // Add these options
    httpProxyOptions: {
        xfwd: true,
    },
    // Allow credentials
    corsMaxAge: 1728000,
    cors: {
        origin: true,
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']
    }
}).listen(port, host, function() {
    console.log('Running CORS Anywhere on ' + host + ':' + port);
}); 