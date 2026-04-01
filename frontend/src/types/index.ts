// ─── Auth ────────────────────────────────────────────────────────────────────
export type UserRole = 'operator' | 'supervisor' | 'admin'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
}

// ─── Contact ─────────────────────────────────────────────────────────────────
export interface Contact {
  id: string
  phone: string
  name?: string
  email?: string
  notes?: string
  created_at: string
  updated_at: string
}

// ─── Conversation ─────────────────────────────────────────────────────────────
export type ConversationStatus = 'open' | 'closed' | 'pending'

export interface Conversation {
  id: string
  contact_id: string
  contact?: Contact
  channel_id: string
  channel_type: string
  status: ConversationStatus
  last_message_text?: string
  last_message_at?: string
  unread_count: number
  assigned_to?: string
  assigned_operator_name?: string
  created_at: string
  updated_at: string
}

// ─── Message ─────────────────────────────────────────────────────────────────
export type MessageDirection = 'inbound' | 'outbound'
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  id: string
  conversation_id: string
  contact_id: string
  direction: MessageDirection
  text?: string
  media_url?: string
  media_type?: string
  status: MessageStatus
  wazzup_message_id?: string
  sent_by?: string
  created_at: string
}

// ─── Case ────────────────────────────────────────────────────────────────────
export type CaseStatus = 'new' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
export type CasePriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Case {
  id: string
  conversation_id: string
  contact_id: string
  title?: string
  description?: string
  status: CaseStatus
  priority: CasePriority
  category?: string
  assigned_to?: string
  assigned_operator_name?: string
  resolved_at?: string
  created_at: string
  updated_at: string
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────
export interface WsEvent {
  type: 'new_message' | 'conversation_updated' | 'case_updated' | 'message_status_updated'
  data: Message | Conversation | Case
  conversation_id?: string
  contact?: Pick<Contact, 'id' | 'phone' | 'name'>
}
