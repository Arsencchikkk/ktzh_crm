'use client'

import { useState, useCallback } from 'react'
import api from '@/lib/api'
import type { Message } from '@/types'

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return
    setLoading(true)
    try {
      const { data } = await api.get<Message[]>(
        `/conversations/${conversationId}/messages`
      )
      setMessages(data)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversationId) return
      setSending(true)
      try {
        const { data } = await api.post<Message>(
          `/conversations/${conversationId}/messages`,
          { text }
        )
        setMessages((prev) => [...prev, data])
        return data
      } finally {
        setSending(false)
      }
    },
    [conversationId]
  )

  const appendMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      if (prev.find((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }, [])

  return { messages, loading, sending, fetchMessages, sendMessage, appendMessage }
}
