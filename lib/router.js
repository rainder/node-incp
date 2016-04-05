'use strict';

const co = require('co');
const routes = require('./routes');
const Request = require('./message/ic-request');
const Response = require('./message/ic-response');
const validation = require('./validation');

const V = validation.V;
const validate = {
  type: validation([{
    $schema: {
      type: V(String).oneOf([
        Request.TYPE,
        Response.TYPE
      ]).required(),
    }
  }])
};

module.exports = {
  route
};

/**
 *
 * @param ic {INCP}
 * @param socket
 * @param message
 * @returns {Promise}
 */
function route(ic, socket, message) {
  const ctx = {
    ic
  };

  return co(function *() {
    try {
      validate.type(message);
    } catch (err) {
      return Response.create()
        .setId(message.id)
        .setError(err)
        .send(socket);
    }

    if (message.type === Request.TYPE) {
      const request = Request.createFromIncoming(message);
      const endpoint = routes[request.getMethod()];

      if (endpoint === undefined) {
        throw new Error(`Unknown endpoint specified ${request.getMethod()}`);
      }

      const result = yield endpoint.call(ctx, request.getData());

      return Response.create()
        .setId(request.getId())
        .setData(result)
        .send(socket);
    }

    if (message.type === Response.TYPE) {
      const delivered = Response.createFromIncoming(message).deliver();
      if (!delivered) {
        console.error('INCP Response is not delivered', message);
      }
    }
  }).then((result) => {

  }).catch((err) => {
    return Response.create()
      .setError(err)
      .setId(message.id)
      .send(socket);
  });
}
