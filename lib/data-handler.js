'use strict';

const objectid = require('objectid');
const q = require('q');
const debug = require('debug');

const utils = require('./utils');
const callbacks = require('./callbacks');

const d = {
  incoming: debug('intercon-core:data-handler:incoming'),
  outgoing: debug('intercon-core:data-handler:outgoing')
};

module.exports = {
  incoming,
  outgoing,
  req,
  push,
  res
};

/**
 *
 * @param socket
 * @param data
 * @private
 */
function incoming(cb) {
  let fragment = '';

  return function (data) {
    let split = data.split('\n');

    if (split.length === 1) {
      fragment += split[0];
      return;
    }

    if (fragment.length) {
      split[0] = fragment + split[0];
      fragment = '';
    }

    for (let item of split) {
      if (!item.length) {
        continue;
      }

      try {
        let json = JSON.parse(item);
        d.incoming(json);
        cb(json);
      } catch (e) {
        fragment = item;
      }
    }
  }
}

/**
 *
 * @param socket
 * @param data
 * @returns {*|promise}
 */
function outgoing(socket) {
  return function (data) {
    d.outgoing(data);
    const dfd = q.defer();
    const payload = JSON.stringify(data);

    socket.write(`${payload}\n`, utils.callbackToDefer(dfd));

    return dfd.promise;
  };
}

/**
 *
 * @param socket
 * @param method
 * @param data
 * @returns {*|promise}
 */
function req(socket, method, data) {
  let req = makeReq(method, data);

  outgoing(socket)(req.message).catch(function (err) {
    callbacks.execute(req.callback.id, false, err);
  });

  return req.callback;
}

/**
 *
 * @param socket
 * @param method
 * @param data
 * @returns {*|promise}
 */
function push(socket, method, data) {
  return outgoing(socket)(makePush(method, data));
};

/**
 *
 * @param socket
 * @param id
 * @param data
 * @returns {*}
 */
function res(socket, id, success, data) {
  return outgoing(socket)(makeRes(id, success, data));
}

/**
 *
 * @param method
 * @param data
 * @param id
 * @returns {{message: {id: *, type: string, method: *, data: *}, callback: (*|promise)}}
 */
function makeReq(method, data, id) {
  id = id || objectid().toString();
  const message = {
    id: id,
    type: 'request',
    method, data
  };

  let callback = callbacks.create(id);

  return { message, callback };
}

/**
 *
 * @param id
 * @param success
 * @param data
 * @returns {{id: *, type: string, success: *, data: *}}
 */
function makeRes(id, success, data) {
  if (data instanceof Error) {
    data = {
      message: data.message
    };
  }

  const message = {
    id: id,
    type: 'response',
    success: success,
    data
  };

  return message;
}

/**
 *
 * @param method
 * @param data
 * @returns {{type: string, method: *, data: *}}
 */
function makePush(method, data) {
  return {
    type: 'push',
    method, data
  };
}