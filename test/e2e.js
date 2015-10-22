'use strict';

require('co-mocha');

const chai = require('chai');
const q = require('q');
const net = require('net');

const IC = require('./..');
const utils = require('app/utils');

chai.should();

describe('Server', function () {
  this.timeout(10000);

  it('should create three instances', function *() {
    let instances = [];
    let nodes = [
      [],
      ['127.0.0.1:9401'],
      ['127.0.0.1:9401']
    ];

    for (let i = 1; i <= 3; i++) {
      let instance = new IC({
        name: `test${i}`,
        type: 'poi',
        host: '127.0.0.1',
        port: 9400 + i
      });

      instance.on('established', function (node) {
        //console.log(i, node.getId());
        //console.log(i, 'established', id);
      });

      instance.on('message', function (message, node) {
        //console.error(arguments);
        instance.respond(message.id, true, { data: true });
      });

      yield instance.startServer();
      for (let node of nodes[i - 1]) {
        let address = utils.parseAddress(node);
        yield instance.connect(address);
      }

      instances[instances.length] = instance;
    }

    //yield function (cb) {
    //  setTimeout(cb, 100);
    //};

    let node = instances[0].getRandomNodeByType('poi');

    let r = yield node.sendRequest({
      poi: 123
    });

    r.data.should.equals(true);

    //console.log(instances);
    //let num = yield function (cb) {
    //  instances[0].server.server.getConnections(function (err, num) {
    //    cb(err, num);
    //  });
    //};
    //
    //console.log(num);
  });

  it('should create two instances 2', function *() {
    let instances = [];
    let promises = [];
    let nodes = [
      ['127.0.0.1:9501'],
      ['127.0.0.1:9500']
    ];

    for (let i = 0; i < 2; i++) {
      let dfd = q.defer();
      promises.push(dfd.promise);
      let instance = new IC({
        name: `test${i}`,
        type: 'poi',
        host: '127.0.0.1',
        port: 9500 + i
      });

      instance.on('established', function (node) {
        console.error('!!!!!!!!!');
        dfd.resolve();
      });

      instance.on('message', function (json, socket) {
        console.log(json, !!socket);
      });

      yield instance.startServer();
      instances[instances.length] = instance;
    }

    for (let instance of instances) {
      for (let node of nodes[instances.indexOf(instance)]) {
        let address = utils.parseAddress(node);
        yield instance.connect(address);
      }
    }

    yield promises;

    for (let instance of instances) {
      for (let node of instance.manager.mapById.values()) {
        console.log(node.getInfo());
      }
    }
  });
});