'use strict';

const dataHandler = require('./data-handler');

module.exports = Node;

function Node(info, socket) {
  this.info = info;
  this.socket = socket;
}

Node.prototype.getId = function () {
  return this.info.id;
};

Node.prototype.getType = function () {
  return this.info.type;
};

Node.prototype.getInfo = function () {
  return this.info;
};

Node.prototype.getSocket = function () {
  return this.socket;
};

Node.prototype.sendRequest = function (data) {
  return dataHandler.req(this.socket, 'external', data);
};

Node.prototype.sendPush = function (data) {
  return dataHandler.push(this.socket, 'external', data);
};

//Node.prototype.sendResponse = function (id, success, data) {
//  let res = dataHandler.make.res(id, data);
//  return dataHandler.outcoming(this.socket, res);
//};