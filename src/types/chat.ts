/**
 * Kiểu dữ liệu cho tin nhắn chat
 */
export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
  imageUrl?: string;
  isRead: boolean;
}

/**
 * Kiểu dữ liệu cho cuộc trò chuyện
 */
export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantRole?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isActive?: boolean;
}
