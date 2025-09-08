/**
 * Kiểu dữ liệu cho tin nhắn chat
 */
export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  timestamp: string;
  type: "text" | "image" | "file";
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
  lastMessageSender?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isActive?: boolean;
}

/**
 * Payload để tạo cuộc trò chuyện
 */
export type CreateConversationPayload = {
  type: "DIRECT" | "GROUP";
  participantIds: string[];
  name?: string;
  avatarGroup?: string;
};