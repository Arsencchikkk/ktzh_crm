'use client'

import { useState, useEffect } from 'react'
import {
  User, AlertCircle, Tag, ChevronDown, CheckCircle2,
  Clock, XCircle, RefreshCw, UserCheck
} from 'lucide-react'
import type { Conversation, Case, User as IUser, CaseStatus, CasePriority } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import api from '@/lib/api'

interface CasePanelProps {
  conversation: Conversation | null
  operators: IUser[]
  currentUser: IUser | null
}

const caseStatusOptions: { value: CaseStatus; label: string; variant: any }[] = [
  { value: 'new', label: 'Новое', variant: 'info' },
  { value: 'in_progress', label: 'В работе', variant: 'warning' },
  { value: 'waiting', label: 'Ожидание', variant: 'purple' },
  { value: 'resolved', label: 'Решено', variant: 'success' },
  { value: 'closed', label: 'Закрыто', variant: 'default' },
]

const priorityOptions: { value: CasePriority; label: string }[] = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'urgent', label: 'Срочный' },
]

const priorityVariant: Record<CasePriority, any> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
}

const categoryOptions = [
  'Задержка поезда',
  'Возврат билета',
  'Качество услуг',
  'Потеря багажа',
  'Поведение персонала',
  'Технические проблемы',
  'Другое',
]

export function CasePanel({ conversation, operators, currentUser }: CasePanelProps) {
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!conversation) {
      setCaseData(null)
      return
    }
    loadCase()
  }, [conversation?.id])

  const loadCase = async () => {
    if (!conversation) return
    setLoading(true)
    try {
      const { data } = await api.get<Case | null>(`/cases/conversation/${conversation.id}`)
      setCaseData(data)
    } catch {
      setCaseData(null)
    } finally {
      setLoading(false)
    }
  }

  const createCase = async () => {
    if (!conversation) return
    setLoading(true)
    try {
      const { data } = await api.post<Case>(`/cases/conversation/${conversation.id}`)
      setCaseData(data)
    } finally {
      setLoading(false)
    }
  }

  const updateCase = async (update: Partial<Case>) => {
    if (!caseData) return
    setUpdating(true)
    try {
      const { data } = await api.patch<Case>(`/cases/${caseData.id}`, update)
      setCaseData(data)
    } finally {
      setUpdating(false)
    }
  }

  if (!conversation) {
    return (
      <div className="h-full bg-surface-900 border-l border-surface-800 flex flex-col items-center justify-center text-surface-600 p-4">
        <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-xs text-center">Выберите диалог для просмотра обращения</p>
      </div>
    )
  }

  const contact = conversation.contact

  return (
    <div className="h-full bg-surface-900 border-l border-surface-800 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-surface-800 flex-shrink-0">
        <h3 className="text-sm font-bold text-surface-100">Карточка обращения</h3>
      </div>

      {/* Contact section */}
      <div className="px-4 py-4 border-b border-surface-800">
        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">Контакт</p>
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={contact?.name || contact?.phone} size="md" />
          <div>
            <p className="text-sm font-semibold text-surface-100">{contact?.name || 'Неизвестный'}</p>
            <p className="text-xs text-surface-500">+{contact?.phone}</p>
          </div>
        </div>
        {contact?.email && (
          <p className="text-xs text-surface-400">📧 {contact.email}</p>
        )}
        {contact?.notes && (
          <p className="text-xs text-surface-500 mt-2 italic">{contact.notes}</p>
        )}
      </div>

      {/* Case section */}
      <div className="px-4 py-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Обращение</p>
          {caseData && (
            <button
              onClick={loadCase}
              className="p-1 text-surface-500 hover:text-surface-300 transition-colors"
              title="Обновить"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-surface-700 border-t-primary-500" />
          </div>
        ) : !caseData ? (
          <div className="text-center py-6">
            <p className="text-xs text-surface-500 mb-3">Обращение не создано</p>
            <button
              onClick={createCase}
              className="w-full py-2 text-xs font-medium bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
            >
              + Создать обращение
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status */}
            <div>
              <label className="text-xs text-surface-500 block mb-1.5">Статус</label>
              <div className="flex flex-wrap gap-1.5">
                {caseStatusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateCase({ status: opt.value })}
                    disabled={updating}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                      caseData.status === opt.value
                        ? 'border-primary-500 bg-primary-600/20 text-primary-300'
                        : 'border-surface-700 text-surface-400 hover:border-surface-600 hover:text-surface-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs text-surface-500 block mb-1.5">Приоритет</label>
              <select
                value={caseData.priority}
                onChange={(e) => updateCase({ priority: e.target.value as CasePriority })}
                disabled={updating}
                className="w-full text-xs bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-surface-200 focus:outline-none focus:border-primary-600"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-surface-500 block mb-1.5">Категория</label>
              <select
                value={caseData.category || ''}
                onChange={(e) => updateCase({ category: e.target.value || undefined })}
                disabled={updating}
                className="w-full text-xs bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-surface-200 focus:outline-none focus:border-primary-600"
              >
                <option value="">— Выберите категорию —</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Assigned operator */}
            <div>
              <label className="text-xs text-surface-500 block mb-1.5">Оператор</label>
              <select
                value={caseData.assigned_to || ''}
                onChange={(e) => updateCase({ assigned_to: e.target.value || undefined })}
                disabled={updating}
                className="w-full text-xs bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-surface-200 focus:outline-none focus:border-primary-600"
              >
                <option value="">— Не назначен —</option>
                {operators.map((op) => (
                  <option key={op.id} value={op.id}>{op.full_name}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-surface-500 block mb-1.5">Описание</label>
              <textarea
                defaultValue={caseData.description || ''}
                onBlur={(e) => {
                  if (e.target.value !== caseData.description) {
                    updateCase({ description: e.target.value })
                  }
                }}
                placeholder="Описание обращения..."
                rows={3}
                className="w-full text-xs bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-surface-200 placeholder-surface-600 focus:outline-none focus:border-primary-600 resize-none"
              />
            </div>

            {/* Meta */}
            <div className="pt-2 border-t border-surface-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-500">ID обращения</span>
                <span className="text-xs text-surface-400 font-mono">{caseData.id.slice(-8)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-500">Приоритет</span>
                <Badge variant={priorityVariant[caseData.priority]} size="sm">
                  {priorityOptions.find(p => p.value === caseData.priority)?.label}
                </Badge>
              </div>
              {caseData.resolved_at && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-surface-500">Решено</span>
                  <span className="text-xs text-emerald-400">
                    {new Date(caseData.resolved_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
