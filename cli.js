#!/usr/bin/env node
let DevRingerServer = require('./DevRingerServer');
let commandLine = require('command-line-args');

let optionsDefinitions = [
  {
    'name': 'file',
    'type': String,
    'alias': 'f',
    'defaultValue': 'drp.json'
  },
  {
    'name': 'HAR',
    'type': String,
    'alias': 'H'
  },
  {
    'name': 'output',
    'type': String,
    'alias': 'o'
  },
  {
    'name': 'hostname',
    'type': String,
    'alias': 'n',
    'defaultValue': 'localhost'
  },
  {
    'name': 'startPort',
    'type': Number,
    'alias': 's',
    'defaultValue': 8081
  },
  {
    'name': 'startSecurePort',
    'type': Number,
    'alias': 'S',
    'defaultValue': 8444
  }
];

let options = commandLine(optionsDefinitions);

let config = {
  configFile: options.file,
  harFile: options.HAR,
  outputFile: options.output,
  harOptions: {
    hostname: options.hostname,
    startPort: options.startPort,
    startSecurePort: options.startSecurePort
  }
};

let server = new DevRingerServer(undefined, config);

server.drpConf.then((conf) => {
  console.log(JSON.stringify(conf, null, 2));
  console.log('Server listening at ' + conf.entryPoint + ' Press ^C to quit.');
});
