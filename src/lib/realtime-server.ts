// Server-side bridge to the realtime socket.io mini-service.
// This lets Next.js API routes forward command requests to the realtime service
// without exposing MQTT/socket details to the browser.

import { io as ioclient, Socket } from 'socket.io-client'

const REALTIME_PORT = 3003

let _socket: Socket | null = null

export function getRealtimeSocketSafe(): Socket | null {
  // Only attempt in a runtime that has network access (Node).
  if (typeof window !== 'undefined') return null
  try {
    if (!_socket) {
      _socket = ioclient(`http://127.0.0.1:${REALTIME_PORT}`, {
        path: '/',
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 500,
      })
    }
    return _socket
  } catch {
    return null
  }
}
