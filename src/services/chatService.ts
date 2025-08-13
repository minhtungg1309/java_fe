import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import { Conversation } from "../types/chat";
import { handleApiResponse, handleApiError } from "../utils/apiHelpers";

type ParticipantInfo = {
  userId: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
};

type ConversationResponse = {
  id: string;
  type: string; // "DIRECT" | "GROUP"
  participantsHash: string;
  conversationAvatar?: string | null;
  conversationName: string; // BE đã set tên còn lại (đối phương) cho current user
  participants: ParticipantInfo[];
  createdDate: string;
  modifiedDate: string;
};

type ChatMessageResponse = {
  id: string;
  conversationId: string;
  me: boolean;
  message: string;
  sender: ParticipantInfo;
  createdDate: string;
};

const toConversation = (r: ConversationResponse): Conversation => {
  const target =
    r.participants.find(p => p.username === r.conversationName) ?? r.participants[0];

  return {
    id: r.id,
    participantId: target?.userId ?? r.id,
    participantName: r.conversationName,
    participantAvatar: r.conversationAvatar || undefined,
    lastMessage: undefined,
    lastMessageTime: r.modifiedDate,
    participantRole: undefined,
    unreadCount: 0,
    isActive: false,
  };
};

const toChatMessage = (r: ChatMessageResponse) => ({
  id: r.id,
  content: r.message,
  senderId: r.me ? 'current' : r.sender.userId,
  senderName: r.sender.username,
  senderAvatar: undefined, // Thêm nếu backend có avatar
  timestamp: r.createdDate,
  type: 'text' as const,
  isRead: true,
});

export const getMyConversations = async () => {
  try {
    const res = await httpClient.get(API.CONVERSATIONS_MY);
    const data = handleApiResponse<ConversationResponse[]>(res);
    return data.map(toConversation);
  } catch (err) {
    throw handleApiError(err, "Không thể tải danh sách cuộc trò chuyện");
  }
};

export const createConversation = async (participantId: string, type: "DIRECT" | "GROUP" = "DIRECT") => {
  try {
    const res = await httpClient.post(API.CONVERSATIONS_CREATE, { type, participantIds: [participantId] });
    const data = handleApiResponse<ConversationResponse>(res);
    return toConversation(data);
  } catch (err) {
    throw handleApiError(err, "Không thể tạo cuộc trò chuyện");
  }
};

export const getMessages = async (conversationId: string) => {
  try {
    const res = await httpClient.get(API.MESSAGES_GET, { params: { conversationId } });
    const data = handleApiResponse<ChatMessageResponse[]>(res);
    // BE trả desc; đảo lại asc để hiển thị
    return data.map(toChatMessage).reverse();
  } catch (err) {
    throw handleApiError(err, "Không thể tải tin nhắn");
  }
};

export const sendMessage = async (conversationId: string, message: string) => {
  try {
    const res = await httpClient.post(API.MESSAGES_CREATE, { conversationId, message });
    const data = handleApiResponse<ChatMessageResponse>(res);
    return toChatMessage(data);
  } catch (err) {
    throw handleApiError(err, "Không thể gửi tin nhắn");
  }
};
