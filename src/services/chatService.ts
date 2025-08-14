import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { Conversation } from "../types/chat";
import { handleApiResponse, handleApiError } from "../utils/apiHelpers";

/**
 * Thông tin người tham gia từ API
 */
type ParticipantInfo = {
  userId: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
};

/**
 * Response từ API khi lấy danh sách cuộc trò chuyện
 */
type ConversationResponse = {
  id: string;
  type: string; // "DIRECT" | "GROUP"
  participantsHash: string;
  conversationAvatar?: string | null;
  conversationName: string; // Backend đã set tên đối phương cho current user
  participants: ParticipantInfo[];
  createdDate: string;
  modifiedDate: string;
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
 * Chuyển đổi ConversationResponse thành Conversation
 */
const toConversation = (response: ConversationResponse): Conversation => {
  const target = response.participants.find(p => p.username === response.conversationName) 
    ?? response.participants[0];

  return {
    id: response.id,
    participantId: target?.userId ?? response.id,
    participantName: response.conversationName,
    participantAvatar: response.conversationAvatar || undefined,
    lastMessage: undefined,
    lastMessageTime: response.modifiedDate,
    participantRole: undefined,
    unreadCount: 0,
    isActive: false,
  };
};

/**
 * Chuyển đổi ChatMessageResponse thành ChatMessage
 */
const toChatMessage = (response: ChatMessageResponse) => ({
  id: response.id,
  content: response.message,
  senderId: response.me ? 'current' : response.sender.userId,
  senderName: response.sender.username,
  senderAvatar: undefined, // Thêm nếu backend có avatar
  timestamp: response.createdDate,
  type: 'text' as const,
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

/**
 * Tạo cuộc trò chuyện mới với người dùng
 * @param participantId - ID của người tham gia
 * @param type - Loại cuộc trò chuyện (DIRECT hoặc GROUP)
 */
export const createConversation = async (
  participantId: string, 
  type: "DIRECT" | "GROUP" = "DIRECT"
): Promise<Conversation> => {
  try {
    const response = await httpClient.post(API.CONVERSATIONS_CREATE, { 
      type, 
      participantIds: [participantId] 
    });
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
      params: { conversationId } 
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
      message 
    });
    const data = handleApiResponse<ChatMessageResponse>(response);
    return toChatMessage(data);
  } catch (err) {
    throw handleApiError(err, "Không thể gửi tin nhắn");
  }
};
