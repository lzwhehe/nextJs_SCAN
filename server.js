const http = require('http');
const fs = require('fs');
const path = require('path');
const { scanProject } = require('./scan');

const port = process.env.PORT || 3000;

function serveFile(res, filePath, contentType) {
  fs.readFile(path.join(__dirname, filePath), (err, data) => {
    if (err) {
      res.statusCode = 500;
      res.end('Server error');
    } else {
      res.setHeader('Content-Type', contentType);
      res.end(data);
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    return serveFile(res, 'public/index.html', 'text/html');
  }
  if (req.method === 'GET' && req.url === '/script.js') {
    return serveFile(res, 'public/script.js', 'text/javascript');
  }
  if (req.method === 'POST' && req.url === '/scan') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const logs = [];
        const result = scanProject(path.resolve(data.target || '.'), l => logs.push(l));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ log: logs, result }));
      } catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end('Not found');
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
