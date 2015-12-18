'use strict';

const objectid = require('objectid');
const q = require('q');
const d = require('debug');

const utils = require('./utils');
const callbacks = require('./callbacks');

const debug = {
  incoming: d('intercon-core:data-handler:incoming'),
  outcoming: d('intercon-core:data-handler:outcoming')
};

module.exports = {
  incoming,
  outcoming,
  req,
  push,
  make: {
    req: makeReq,
    res: makeRes
  }
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
        debug.incoming(json);
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
function outcoming(socket) {
  return function (data) {
    debug.outcoming(data);
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

  outcoming(socket)(req.message).catch(function (err) {
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
  return outcoming(socket)({
    type: 'push',
    method, data
  });
};

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