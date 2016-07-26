'use strict';

const co = require('co');
const routes = require('./routes');
const Request = require('./message/ic-request');
const Response = require('./message/ic-response');
const V = require('./validation');

const validate = {
  type: V.Schema({
    type: V(String).oneOf([
      Request.TYPE,
      Response.TYPE
    ]).required(),
  })
};

module.exports = {
  route
};

/**
 *
 * @param incp {INCP}
 * @param socket
 * @param request {ICRequest}
 * @returns {Promise}
 */
function route(incp, socket, request) {
  const ctx = {
    incp,
    socket
  };

  return co(function *() {
    const endpoint = routes[request.getMethod()];

    if (endpoint === undefined) {
      throw new Error(`Unknown endpoint specified ${request.getMethod()}`);
    }

    const result = yield endpoint.call(ctx, request.getData());

    return Response.create()
      .setId(request.getId())
      .setData(result)
      .send(socket);
  }).catch((err) => {
    return Response.create()
      .setError(err)
      .setId(request.id)
      .send(socket);
  });
}
