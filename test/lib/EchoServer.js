const http = require('http');

class EchoServer {
  constructor (port) {
    this.server = http.createServer((request, response) => {
      let body = [];
      request.on('data', (chunk) => {
        body.push(chunk);
      }).on('end', () => {
        body = Buffer.concat(body).toString();
        response.end(body);
      });
    });
    this.port = port;
  }
  start () {
    this.server.listen(this.port);
  }
  stop () {
    this.server.close();
  }
}

module.exports = EchoServer;
