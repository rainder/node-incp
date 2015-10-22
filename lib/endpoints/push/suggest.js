'use strict';

const debug = require('debug')('app:suggest');

module.exports = function *(data, socket) {
  debug('got', data);
  
  if (this.app.mapById.has(data.id)) {
    debug('id already exists. ignoring');
    return;
  }

  if (this.app.options.host === data.data.host && this.app.options.port === data.data.port) {
    debug('same address. ignoring.')
    return;
  }

  yield this.app.connect({
    host: data.data.host,
    port: data.data.port
  });
};