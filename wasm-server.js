const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const WASM_FILE = path.join(__dirname, 'src', 'canvaskit.wasm');

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  if (req.url === '/canvaskit.wasm' && req.method === 'GET') {
    try {
      const wasmData = fs.readFileSync(WASM_FILE);
      
      res.setHeader('Content-Type', 'application/wasm');
      res.setHeader('Content-Length', wasmData.length);
      res.writeHead(200);
      res.end(wasmData);
      
      console.log('Served canvaskit.wasm');
    } catch (error) {
      console.error('Error serving WASM file:', error);
      res.writeHead(404);
      res.end('WASM file not found');
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`WASM server running on http://localhost:${PORT}`);
  console.log(`WASM available at: http://localhost:${PORT}/canvaskit.wasm`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down WASM server...');
  server.close();
  process.exit(0);
});