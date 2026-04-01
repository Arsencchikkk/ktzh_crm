'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { WsEvent } from '@/types'
import { getToken } from '@/lib/auth'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
const RECONNECT_DELAY = 3000
const PING_INTERVAL = 25000

export function useWebSocket(onEvent: (event: WsEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null)
  const pingTimer = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    const token = getToken()
    if (!token) return

    const url = `${WS_URL}/ws?token=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[WS] Connected')
      // Start ping-pong to keep alive
      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping')
        }
      }, PING_INTERVAL)
    }

    ws.onmessage = (evt) => {
      if (evt.data === 'pong') return
      try {
        const event: WsEvent = JSON.parse(evt.data)
        onEventRef.current(event)
      } catch (e) {
        console.error('[WS] Parse error', e)
      }
    }

    ws.onerror = (e) => {
      console.error('[WS] Error', e)
    }

    ws.onclose = () => {
      console.log('[WS] Disconnected, reconnecting...')
      if (pingTimer.current) clearInterval(pingTimer.current)
      if (mountedRef.current) {
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (pingTimer.current) clearInterval(pingTimer.current)
      wsRef.current?.close()
    }
  }, [connect])
}
