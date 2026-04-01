'use client'

import { useState, useCallback } from 'react'
import api from '@/lib/api'
import type { Conversation, ConversationStatus } from '@/types'

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async (status?: ConversationStatus) => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = {}
      if (status) params.status = status
      const { data } = await api.get<Conversation[]>('/conversations', { params })
      setConversations(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateConversation = useCallback(
    async (id: string, update: { status?: ConversationStatus; assigned_to?: string }) => {
      const { data } = await api.patch<Conversation>(`/conversations/${id}`, update)
      setConversations((prev) => prev.map((c) => (c.id === id ? data : c)))
      return data
    },
    []
  )

  // Called when a new WS message arrives — update or prepend conversation
  const upsertConversation = useCallback((conv: Partial<Conversation> & { id: string }) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === conv.id)
      if (idx >= 0) {
        const updated = { ...prev[idx], ...conv }
        const rest = prev.filter((c) => c.id !== conv.id)
        return [updated, ...rest]
      }
      return prev
    })
  }, [])

  // Increment unread count when new inbound message comes in
  const incrementUnread = useCallback((convId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId ? { ...c, unread_count: c.unread_count + 1 } : c
      )
    )
  }, [])

  const clearUnread = useCallback((convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
    )
  }, [])

  return {
    conversations,
    loading,
    error,
    fetchConversations,
    updateConversation,
    upsertConversation,
    incrementUnread,
    clearUnread,
  }
}
