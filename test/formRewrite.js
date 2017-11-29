const EchoServer = require('./lib/EchoServer');

const assert = require('assert');
const req = require('supertest');

describe('Form Rewrite', function() {
  before(function() {
    this.server = new EchoServer(9000);
    this.server.start();
  })
  
  it('should send a form', function(done) {
    req('http://localhost:9000')
    .post('/')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send('user=tobi')
    .expect(200, 'user=tobi', done)
  })
  
  after(function() {
    this.server.stop();
  })
});