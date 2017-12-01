const { createServer } = require('../../lib/common');

class EchoServer {
  constructor (protocol, port) {
    this.server = createServer(protocol, (request, response) => {
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
