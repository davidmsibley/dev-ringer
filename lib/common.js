const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const HTTPS = 'https';
const HTTP = 'http';

const sslConfig = {
  key: fs.readFileSync(path.resolve(__dirname, '../localhost-private.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, '/../localhost-public.pem'))
};

const createServer = function (protocol, handler) {
  var server = {
    http: function (handler) {
      return http.createServer(handler);
    },
    https: function (handler) {
      return https.createServer(sslConfig, handler);
    }
  };
  return server[protocol](handler);
};

/**
 * Put together pieces of a URL.
 * Sometimes you want protocol, sometimes you don't. Just put your parts in
 * here so you don't have to do the string manipulation all over the place
 * @param  {string} protocol Optional. eg. http or https
 * @param  {string} host Hostname, eg. localhost
 * @param  {number} port Optional. eg. 8080
 * @param  {string} path Optional. Anything you want to slap on afterwards.
 * @return {string}        The created address
 */
function addressify (protocol, host, port, path) {
  const PROTOCOL_SEPARATOR = '://';
  const PORT_SEPARATOR = ':';
  const PATH_SEPARATOR = '/';
  let result = '';

  if (protocol) {
    result += protocol + PROTOCOL_SEPARATOR;
  }
  if (host) {
    result += host;
  }
  if (port) {
    result += PORT_SEPARATOR + port;
  }
  if (path) {
    if (!path.startsWith(PATH_SEPARATOR)) {
      result += PATH_SEPARATOR;
    }
    result += path;
  }

  return result;
}

module.exports = {
  addressify,
  createServer,
  HTTP,
  HTTPS
};
