'use client'

import { useState } from 'react'
import { Search, Filter, RefreshCw } from 'lucide-react'
import type { Conversation, ConversationStatus } from '@/types'
import { ConversationItem } from './ConversationItem'
import { Spinner } from '@/components/ui/Spinner'

interface ConversationListProps {
  conversations: Conversation[]
  activeId: string | null
  loading: boolean
  onSelect: (conv: Conversation) => void
  onRefresh: () => void
}

const FILTERS: { label: string; value: ConversationStatus | 'all' }[] = [
  { label: 'Все', value: 'all' },
  { label: 'Открытые', value: 'open' },
  { label: 'Ожидание', value: 'pending' },
  { label: 'Закрытые', value: 'closed' },
]

export function ConversationList({
  conversations,
  activeId,
  loading,
  onSelect,
  onRefresh,
}: ConversationListProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ConversationStatus | 'all'>('all')

  const filtered = conversations.filter((c) => {
    const name = c.contact?.name || c.contact?.phone || ''
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      (c.last_message_text || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="flex flex-col h-full bg-surface-900 border-r border-surface-800">
      {/* Header */}
      <div className="px-4 py-4 border-b border-surface-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-surface-100">Диалоги</h2>
            <p className="text-xs text-surface-500 mt-0.5">{conversations.length} всего</p>
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
            title="Обновить"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-500" />
          <input
            type="text"
            placeholder="Поиск по имени или сообщению..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-surface-800 border border-surface-700 rounded-lg text-surface-200 placeholder-surface-500 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600/30"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${
                filter === f.value
                  ? 'bg-primary-600 text-white'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-surface-500">
            <p className="text-sm">Нет диалогов</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
              onClick={() => onSelect(conv)}
            />
          ))
        )}
      </div>
    </div>
  )
}
