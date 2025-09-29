import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { Conversation, CreateConversationPayload } from "../types/chat";
import { handleApiResponse, handleApiError } from "../utils/apiHelpers";

/**
 * Thông tin người tham gia từ API
 */
type ParticipantInfo = {
  userId: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
};

/**
 * Response từ API khi lấy danh sách cuộc trò chuyện
 */
type ConversationResponse = {
  id: string;
  type: string; // "DIRECT" | "GROUP"
  participantsHash: string;
  conversationAvatar?: string | null;
  conversationName: string;
  participants: ParticipantInfo[];
  lastMessage?: string; // ← Thêm tin nhắn cuối
  lastMessageSender?: string; // ← Thêm tên người gửi
  unreadCount?: number; // ← Thêm số tin nhắn chưa đọc
  createdDate: string;
  modifiedDate: string;
};

/**
 * Chuyển đổi ConversationResponse thành Conversation
 */
const toConversation = (response: ConversationResponse): Conversation => {
  const isGroup = response.type === "GROUP";
  const target =
    response.participants.find(
      (p) => p.username === response.conversationName
    ) ?? response.participants[0];

  return {
    id: response.id,
    participantId: target?.userId ?? response.id,
    participantName: response.conversationName,
    participantAvatar: isGroup
      ? response.conversationAvatar || undefined
      : target?.avatar || undefined,
    lastMessage: response.lastMessage || undefined,
    lastMessageSender: response.lastMessageSender || undefined,
    lastMessageTime: response.modifiedDate,
    participantRole: undefined,
    unreadCount: response.unreadCount || 0,
    isActive: false,
  };
};

/**
 * Response từ API khi lấy tin nhắn
 */
type ChatMessageResponse = {
  id: string;
  conversationId: string;
  me: boolean;
  message: string;
  sender: ParticipantInfo;
  createdDate: string;
};

/**
 * Chuyển đổi ChatMessageResponse thành ChatMessage
 */
const toChatMessage = (response: ChatMessageResponse) => ({
  id: response.id,
  content: response.message,
  senderId: response.me ? "current" : response.sender.userId,
  senderName: response.sender.username,
  senderAvatar: response.sender.avatar, 
  timestamp: response.createdDate,
  type: "text" as const,
  isRead: true,
});

/**
 * Lấy danh sách cuộc trò chuyện của người dùng hiện tại
 */
export const getMyConversations = async (): Promise<Conversation[]> => {
  try {
    const response = await httpClient.get(API.CONVERSATIONS_MY);
    const data = handleApiResponse<ConversationResponse[]>(response);
    return data.map(toConversation);
  } catch (err) {
    throw handleApiError(err, "Không thể tải danh sách cuộc trò chuyện");
  }
};

export const createConversation = async (
  participantIds: string[] | string,
  type: "DIRECT" | "GROUP" = "DIRECT",
  name?: string,
  avatarGroup?: string
): Promise<Conversation> => {
  try {
    const payload: CreateConversationPayload = {
      type,
      participantIds: Array.isArray(participantIds)
        ? participantIds
        : [participantIds],
    };
    if (type === "GROUP") {
      payload.name = name;
      payload.avatarGroup = avatarGroup;
    }
    const response = await httpClient.post(API.CONVERSATIONS_CREATE, payload);
    const data = handleApiResponse<ConversationResponse>(response);
    return toConversation(data);
  } catch (err) {
    throw handleApiError(err, "Không thể tạo cuộc trò chuyện");
  }
};

/**
 * Lấy danh sách tin nhắn của một cuộc trò chuyện
 * @param conversationId - ID của cuộc trò chuyện
 */
export const getMessages = async (conversationId: string) => {
  try {
    const response = await httpClient.get(API.MESSAGES_GET, {
      params: { conversationId },
    });
    const data = handleApiResponse<ChatMessageResponse[]>(response);
    // Backend trả về theo thứ tự giảm dần, đảo lại để hiển thị tăng dần
    return data.map(toChatMessage).reverse();
  } catch (err) {
    throw handleApiError(err, "Không thể tải tin nhắn");
  }
};

/**
 * Gửi tin nhắn trong cuộc trò chuyện
 * @param conversationId - ID của cuộc trò chuyện
 * @param message - Nội dung tin nhắn
 */
export const sendMessage = async (conversationId: string, message: string) => {
  try {
    const response = await httpClient.post(API.MESSAGES_CREATE, {
      conversationId,
      message,
    });
    const data = handleApiResponse<ChatMessageResponse>(response);
    return toChatMessage(data);
  } catch (err) {
    throw handleApiError(err, "Không thể gửi tin nhắn");
  }
};
