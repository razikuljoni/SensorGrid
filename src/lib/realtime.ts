'use client'

import { useEffect, useRef, useState } from 'react'
import type { ServerSocketEvent } from './types'

// Single shared SSE connection replacing socket.io mini-service.
// Connects to /api/realtime Route Handler.
export function useRealtimeSocket(handler: (event: ServerSocketEvent) => void) {
  const [isConnected, setIsConnected] = useState(false)
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    let es: EventSource | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      es = new EventSource('/api/realtime')

      es.onopen = () => {
        setIsConnected(true)
      }

      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as ServerSocketEvent
          handlerRef.current(data)
        } catch {}
      }

      es.onerror = () => {
        setIsConnected(false)
        if (es) {
          es.close()
          es = null
        }
        // Auto reconnect after 3s
        retryTimer = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      if (retryTimer) clearTimeout(retryTimer)
      if (es) {
        es.close()
        es = null
      }
      setIsConnected(false)
    }
  }, [])

  return { socket: null, isConnected }
}

export function getRealtimeSocket() {
  return null
}
