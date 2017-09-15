const Locator = require('./lib/Locator');
const ProxyEndpoint = require('./lib/ProxyEndpoint');
const RedirectEndpoint = require('./lib/RedirectEndpoint');
const Rule = require('./lib/Rule');

const { HTTP, HTTPS, LOCATION, addressify } = require('./lib/common');
const { rewriteBody, rewriteHeader } = require('./lib/rewrites');

let config = {
  path: process.argv[2] || '/web',
};

let local = {
  target: new Locator({
    protocol: HTTP,
    host: 'localhost',
    port: 8080,
  }),
};
let predev = {
  source: new Locator({
    protocol: HTTPS,
    host: 'localhost',
    port: 8443,
  }),
  target: new Locator({
    protocol: HTTPS,
    host: 'predev.my.wisc.edu',
  })
};
let login = {
  source: new Locator({
    protocol: HTTPS,
    host: 'localhost',
    port: 8444,
  }),
  target: new Locator({
    protocol: HTTPS,
    host: 'logintest.wisc.edu',
  })
};
let search  = {
  target: new Locator({
    protocol: HTTPS,
    host: 'www.googleapis.com',
  })
}
let redirect = {
  source: new Locator({
    protocol: HTTP,
    host: 'localhost',
    port: 8081,
  }),
  target: predev.source,
};

local = new ProxyEndpoint(local);
search = new ProxyEndpoint(search);
predev = new ProxyEndpoint(predev, [
  new Rule({
    handler: rewriteHeader( // Handle weird non-https location
      LOCATION,
      addressify(HTTP, predev.source.host, predev.source.port),
      addressify(HTTPS, predev.source.host, predev.source.port)
    ),
  }),
  new Rule({
    handler: rewriteHeader(
      LOCATION,
      predev.target.host,
      addressify(null, predev.source.host, predev.source.port)
    ),
  }),
  new Rule({
    handler: rewriteHeader(
      LOCATION,
      login.target.host,
      addressify(null, login.source.host, login.source.port)
    ),
  }),
  new Rule({
    path: config.path,
    handler: function(req, res) {
      req.url = req.originalUrl;
      local.proxy.web(req, res);
      return false;
    },
  }),
  new Rule({
    path: '/aries/proxy/wiscedusearch',
    handler: function(req, res) {
      if ('/customsearch/v1') {
        req.url = '/customsearch/v1' + req.url;
      } else {
        req.url = req.originalUrl;
      }
      console.log(req.url);
      search.proxy.web(req, res);
      return false;
    },
  })
]).listen();
login = new ProxyEndpoint(login, [
  new Rule({
    handler: rewriteHeader(LOCATION, predev.target.host, addressify(null, predev.source.host, predev.source.port)),
  }),
  new Rule({
    handler: rewriteBody(
      predev.target.host,
      addressify(null, predev.source.host, predev.source.port)
    ),
  }),
]).listen();
redirect = new RedirectEndpoint(redirect).listen();
