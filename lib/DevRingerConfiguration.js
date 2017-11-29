const fs = require('fs');
const JSONStream = require('JSONStream');
const Promise = require('promise');
const through = require('through2');
const { URL } = require('url');

const { HTTP, HTTPS, addressify } = require('./common');

class DevRingerConfiguration {
  static fromDRP (filename) {
    return new Promise(function (resolve, reject) {
      fs.readFile(filename, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(data));
        }
      });
    });
  };

  static toDRP (filename, output) {
    fs.writeFileSync(filename, output);
  }

  static fromHAR (filename, options) {
    let devHostname = options.hostname;
    let devPort = {
      [HTTP]: options.startPort,
      [HTTPS]: options.startSecurePort
    };

    let earliest = {
      time: new Date().toISOString(),
      url: null
    };
    let hosts = {};
    let pageRefs = {};

    let gatherHosts = JSONStream.parse('log.entries.*');
    gatherHosts.on('header', data => {
      data.pages.forEach(el => {
        pageRefs[el.id] = new URL(el.title).origin;
      });
    });

    return new Promise(function (resolve, reject) {
      fs.createReadStream(filename)
        .pipe(gatherHosts)
        .pipe(through.obj(function (entry, enc, cb) {
          let url = new URL(entry.request.url);
          let key = url.origin;

          if (entry.startedDateTime < earliest.time) {
            earliest.time = entry.startedDateTime;
            earliest.url = url;
          }

          if (!hosts[key]) {
            hosts[key] = {
              devOrigin: addressify(url.protocol.slice(0, -1), devHostname, devPort[url.protocol.slice(0, -1)]++),
              redirects: [],
              contentLinks: []
            };
          }

          let redirect = (entry.response.redirectURL) ? new URL(entry.response.redirectURL, url.origin).origin : null;
          if (redirect && !hosts[key].redirects.includes(redirect)) {
            hosts[key].redirects.push(redirect);
          }

          let refererHeader = entry.request.headers.find(header => {
            return header.name === 'Referer';
          });
          let referer = (refererHeader) ? new URL(refererHeader.value).origin : null;
          if (referer && !hosts[referer]) {
            hosts[referer] = {
              devOrigin: addressify(url.protocol.slice(0, -1), devHostname, devPort[url.protocol.slice(0, -1)]++),
              redirects: [],
              contentLinks: []
            };
          }
          if (referer && !hosts[referer].contentLinks.includes(key)) {
            hosts[referer].contentLinks.push(key);
          }

          if (entry.pageRef && !hosts[pageRefs[entry.pageref]]) {
            hosts[pageRefs[entry.pageref]] = {
              devOrigin: addressify(url.protocol.slice(0, -1), devHostname, devPort[url.protocol.slice(0, -1)]++),
              redirects: [],
              contentLinks: []
            };
          }
          if (entry.pageref && !hosts[pageRefs[entry.pageref]].contentLinks.includes(key)) {
            hosts[pageRefs[entry.pageref]].contentLinks.push(key);
          }

          cb();
        })).on('finish', () => {
          console.log(hosts);
          let config = {};
          config.entryPoint = hosts[earliest.url.origin].devOrigin + earliest.url.pathname;
          config.servers = {};

          const ALL_PATHS = '*';
          let done = [];
          let next = [];

          let translateToConfig = function (origin) {
            done.push(origin);
            let host = hosts[origin];
            let server = config.servers[host.devOrigin] = {
              proxyPaths: [{
                path: ALL_PATHS,
                // rewrites: [],
                origin
              }],
              locationRewrites: [],
              contentRewrites: []
            };

            (function catchHttpsUpgrading () {
              let originModUrl = new URL(origin);
              if (originModUrl.protocol.slice(0, -1) === HTTP) {
                originModUrl.protocol = HTTPS;
                if (hosts[originModUrl.origin]) {
                  let searchUrl = new URL(host.devOrigin);
                  searchUrl.protocol = HTTPS;
                  server.locationRewrites.push({
                    search: searchUrl.origin,
                    replace: hosts[originModUrl.origin].devOrigin
                  });
                }
              }
            })();

            host.redirects.forEach(redirectOrigin => {
              server.locationRewrites.push({
                search: redirectOrigin,
                replace: hosts[redirectOrigin].devOrigin
              });

              if (!done.includes(redirectOrigin) &&
                !next.includes(redirectOrigin)) {
                next.push(redirectOrigin);
              }
            });
            host.contentLinks.forEach(linkOrigin => {
              server.contentRewrites.push({
                search: linkOrigin,
                replace: hosts[linkOrigin].devOrigin
              });

              if (!done.includes(linkOrigin) &&
                !next.includes(linkOrigin)) {
                next.push(linkOrigin);
              }
            });

            if (0 < next.length) {
              translateToConfig(next.shift());
            }
          };
          translateToConfig(earliest.url.origin);

          resolve(config);
        })
        .on('error', function (err) {
          reject(err);
        });
    });
  }
}

module.exports = DevRingerConfiguration;
