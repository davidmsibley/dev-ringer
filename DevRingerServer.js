const Promise = require('promise');
const { URL } = require('url');

const DevRingerConfig = require('./lib/DevRingerConfiguration');
const Locator = require('./lib/Locator');
const ProxyEndpoint = require('./lib/ProxyEndpoint');
const { rewriteBody, rewriteHeader } = require('./lib/rewrites');
const Rule = require('./lib/Rule');

const LOCATION = 'location';

class DevRingerServer {
  constructor (config, cla) {
    this.drpConf = null;
    this.proxies = [];

    if (config) {
      this.drpConf = Promise.resolve(config);
    } else if (cla) {
      if (cla.harFile) {
        this.drpConf = DevRingerConfig.fromHAR(cla.harFile, cla.harOptions);
        if (cla.outputFile) {
          this.drpConf.then((conf) => {
            DevRingerConfig.toDRP(cla.outputFile, JSON.stringify(conf, null, 2));
          });
        }
      } else if (cla.configFile) {
        this.drpConf = DevRingerConfig.fromDRP(cla.configFile);
      }
    }

    if (!this.drpConf) {
      throw new Error('No configuration found!');
    }
    this.drpConf.then((conf) => {
      this.proxies = [];
      Object.entries(conf.servers).forEach(([key, value]) => {
        let sourceUrl = new URL(key);
        let source = new Locator({
          protocol: sourceUrl.protocol.slice(0, -1),
          host: sourceUrl.hostname,
          port: sourceUrl.port
        });
        let isAllPaths = (el) => {
          return '*' === el.path;
        };
        let targetPath = value.proxyPaths.find(isAllPaths);
        let targetUrl = targetPath ? new URL(targetPath.origin) : null;
        let target = null;
        if (targetUrl) {
          target = new Locator({
            protocol: targetUrl.protocol.slice(0, -1),
            host: targetUrl.hostname,
            port: targetUrl.port
          });
        }
        let rules = [];
        let prxRules = [];
        value.contentRewrites.forEach(({search, replace}) => {
          if (search && replace) {
            rules.push(new Rule({
              handler: rewriteBody(
                new URL(search).origin,
                new URL(replace).origin
              )
            }));
            rules.push(new Rule({
              handler: rewriteBody(
                new URL(search).host,
                new URL(replace).host
              )
            }));
          }
        });
        value.locationRewrites.forEach(({search, replace}) => {
          if (search && replace) {
            prxRules.push(new Rule({
              handler: rewriteHeader(
                LOCATION,
                new URL(search).origin,
                new URL(replace).origin
              )
            }));
            prxRules.push(new Rule({
              handler: rewriteHeader(
                LOCATION,
                new URL(search).host,
                new URL(replace).host
              )
            }));
          }
        });
        value.proxyPaths.forEach(({path, rewrites = [], origin}) => {
          if (!isAllPaths({path})) {
            let originUrl = new URL(origin);
            let offshoot = new ProxyEndpoint({
              target: new Locator({
                protocol: originUrl.protocol.slice(0, -1),
                host: originUrl.hostname,
                port: originUrl.port
              })
            }, rules.slice(), prxRules.slice());
            rules.push(new Rule({
              path: path,
              handler: function (req, res) {
                req.url = req.originalUrl;
                offshoot.proxy.web(req, res);
                return false;
              }
            }));
          }
        });
        this.proxies.push(new ProxyEndpoint({source, target}, rules, prxRules));
      });
      return conf;
    }).catch((err) => {
      console.log(err);
    });

    return this;
  }
  start () {
    this.drpConf.then(() => {
      this.proxies.forEach((proxy) => {
        proxy.listen();
      });
    });
  }
  stop () {
    this.drpConf.then(() => {
      this.proxies.forEach((proxy) => {
        proxy.close();
      });
    });
  }
}

module.exports = DevRingerServer;
