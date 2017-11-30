const DevRingerServer = require('../DevRingerServer');
const EchoServer = require('./lib/EchoServer');
const formDRP = require('./configs/formRewrite');
// const assert = require('assert');
const req = require('supertest');

// https://github.com/visionmedia/supertest/issues/396
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

describe('EchoServer', function () {
  before(function () {
    this.servers = [];
    this.servers.push(new EchoServer('http', 9000));
    this.servers.forEach((server) => {
      server.start();
    });
  });

  it('should echo form data', function (done) {
    req('http://localhost:9000')
      .post('/')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('user=tobi')
      .expect(200, 'user=tobi', done);
  });

  after(function () {
    this.servers.forEach((server) => {
      server.stop();
    });
  });
});

describe('Form Rewrite', function () {
  before(function () {
    this.servers = [];
    this.servers.push(new EchoServer('http', 9080));
    this.servers.push(new EchoServer('https', 9444));
    this.servers.push(new EchoServer('https', 9445));
    this.servers.push(new EchoServer('https', 9446));
    this.servers.forEach((server) => {
      server.start();
    });
    this.proxy = new DevRingerServer(formDRP);
    this.proxy.start();
  });

  it('should rewrite form data', function (done) {
    let sourceForm = 'organization=https%3A%2F%2Flocalhost:8445%2Fidp%2Fshibboleth&entityID=https%3A%2F%2Fmy-test.wisconsin.edu%2Fshibboleth&return=https%3A%2F%2Flocalhost:8444%2FShibboleth.sso%2FDS%3FSAMLDS%3D1%26target%3Dcookie%253A1511884945_564e&rm=select&auto-redirect-preference=on';
    let expected = 'organization=https%3A%2F%2Flocalhost:9445%2Fidp%2Fshibboleth&entityID=https%3A%2F%2Fmy-test.wisconsin.edu%2Fshibboleth&return=https%3A%2F%2Flocalhost:9444%2FShibboleth.sso%2FDS%3FSAMLDS%3D1%26target%3Dcookie%253A1511884945_564e&rm=select&auto-redirect-preference=on';
    req('https://localhost:8444')
      .post('/')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(sourceForm)
      .expect(200, expected, done);
  });

  after(function () {
    this.proxy.stop();
    this.servers.forEach((server) => {
      server.stop();
    });
  });
});
