'use strict';

module.exports = class Loopback {
  constructor(manager) {
    this.manager = manager;
  }

  sendRequest(data) {
    return new Promise((resolve, reject) => {
      this.manager.emit('message', data, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  sendPush(data) {
    return new Promise((resolve, reject) => {
      this.manager.emit('message', data);
      resolve(true);
    });
  }

}