'use strict';

const events = require('events');

const Client = require('./client');
const Server = require('./server');
const utils = require('./utils');
const Node = require('./node');
const GroupedCollection = require('./grouped-collection');
const Loopback = require('./loopback');

module.exports = class Manager extends events.EventEmitter {

  /**
   *
   * @param cfg
   */
  constructor(cfg) {
    cfg.id = utils.makeIdFromAddress(cfg);

    super();

    this.cfg = cfg;
    this.mapById = new Map();
    this.mapByType = new GroupedCollection();
  }

  /**
   *
   * @returns {*}
   */
  startServer() {
    const self = this;

    this.server = new Server({
      type: this.cfg.type,
      name: this.cfg.name,
      host: this.cfg.host,
      port: this.cfg.port
    });

    this.server.on('connection', (socket) => {
      let node = new Node(this.cfg, this);
      node.setServerSocket(socket);
    });

    this.loopback = new Loopback(this);
    return this.server.listen();
  }

  /**
   *
   * @param address
   * @returns {V}
   */
  *connect(address) {
    let id = utils.makeIdFromAddress(address);
    let node = this.getOrCreateNode(id);
    let client = new Client(address.host, address.port);

    node.setClient(client);

    client.connect();
    yield node.waitForEstablishedConnection();

    return node;
  }

  /**
   *
   * @param suggestion
   */
  *processSuggestion(suggestion) {
    for (let id of suggestion) {
      if (this.mapById.get(id)) {
        continue;
      }

      let address = utils.makeAddressFromId(id);

      let node = yield this.connect(address);
      yield node.waitForEstablishedConnection();
    }
  }

  /**
   *
   * @param id
   * @returns {V}
   */
  getOrCreateNode(id) {
    let node = this.mapById.get(id);
    if (!node) {
      node = new Node(this.cfg, this);
      utils.pipeEvent('message', node, this);
      this.mapById.set(id, node);
    }

    return node;
  }

  /**
   *
   * @returns {Array}
   */
  *shutdown() {
    let results = [];
    for (let node of this.mapById.values()) {
      results[results.length] = yield node.shutdown();
    }

    yield this.server.close();

    return results;
  }
};