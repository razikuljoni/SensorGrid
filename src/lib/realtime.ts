'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ServerSocketEvent } from './types'

// Single shared socket connection to the realtime mini-service.
// The mini-service runs on port 3003 and is reached through the Caddy gateway
// using the XTransformPort query parameter.
const REALTIME_PORT = 3003

export function useRealtimeSocket(handler: (event: ServerSocketEvent) => void) {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const handlerRef = useRef(handler)

  // Update the handler ref inside an effect so we never mutate during render.
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const socket = io(`/?XTransformPort=${REALTIME_PORT}`, {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 8000,
      timeout: 12000,
    })
    socketRef.current = socket

    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)
    const onEvent = (event: ServerSocketEvent) => handlerRef.current(event)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('event', onEvent)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('event', onEvent)
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  return { socket: socketRef, isConnected }
}

// Singleton socket for components that need to send events without subscribing
let _singletonSocket: Socket | null = null
export function getRealtimeSocket(): Socket | null {
  if (typeof window === 'undefined') return null
  if (!_singletonSocket) {
    _singletonSocket = io(`/?XTransformPort=${REALTIME_PORT}`, {
      transports: ['websocket', 'polling'],
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    })
  }
  return _singletonSocket
}
