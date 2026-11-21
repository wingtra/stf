import {ServerResponse} from 'node:http'

import cookieSession from 'cookie-session'
import type express from 'express'
import type {
  WebsocketMiddlewareNext
, WebsocketMiddlewareSocket
} from '../../../types/units-websocket.js'

export default function(options: CookieSessionInterfaces.CookieSessionOptions) {
  const session = cookieSession(options)
  return function(socket: WebsocketMiddlewareSocket, next: WebsocketMiddlewareNext) {
    const request = socket.request
    // The cookies library writes response headers when rejecting invalid signatures
    // or refreshing signatures made with a previous key.
    const response = new ServerResponse(request)
    session(request as express.Request, response as express.Response, next as express.NextFunction)
  }
}
