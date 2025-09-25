import React, { useState, useEffect, useCallback } from "react";
import { ConversationList } from "../../components/chat/ConversationList";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { ChatMessage } from "../../components/chat/ChatMessage";
import { MessageInput } from "../../components/chat/MessageInput";
import { Conversation, ChatMessage as ChatMessageType } from "../../types/chat";
import PageMeta from "../../components/common/PageMeta";
import {
  getMyConversations,
  createConversation as createConv,
  getMessages,
  sendMessage,
} from "../../services/chatService";
import { useSocket } from "../../hooks/useSocket";
import { useCall } from "../../hooks/useCall";
import { IncomingCallModal } from "../../components/call/IncomingCallModal";
import { CallModal } from "../../components/call/CallModal";
import { getToken } from "../../services/localStorageService";

/**
 * Trang chính của tính năng chat
 * Quản lý danh sách cuộc trò chuyện, tin nhắn và giao diện chat
 */
// **CLEAN: Extract user ID detection to separate function**
const getUserId = (): string => {
  try {
    // Method 1: From JWT Token (preferred)
    const token = getToken();
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub || payload.userId || payload.user_id;
      if (userId && userId !== 'default-user-id') {
        return userId;
      }
    }

    // Method 2: From localStorage user object
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const userId = user.id || user.userId || user.username;
      if (userId && userId !== 'default-user-id') {
        return userId;
      }
    }

    // Method 3: Direct from localStorage
    const directUserId = localStorage.getItem('userId') || localStorage.getItem('username');
    if (directUserId && directUserId !== 'default-user-id') {
      return directUserId;
    }
  } catch (error) {
    console.error('Error detecting user ID:', error);
  }
  
  return 'default-user-id';
};

export default function Chat() {
  // **CLEAN: Simplified state**
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConversationList, setShowConversationList] = useState(true);

  // **CLEAN: Memoized user ID**
  const currentUserId = React.useMemo(() => {
    const userId = getUserId();
    console.log('Final Current User ID:', userId);
    return userId;
  }, []);

  // **CLEAN: Socket connection**
  const handleIncomingMessage = useCallback(
    (payload: import("../../hooks/useSocket").IncomingMessage) => {
      if (!activeConversation || payload?.conversationId !== activeConversation.id) return;

      const newMsg: ChatMessageType = {
        id: payload.id,
        content: payload.message ?? payload.content ?? "",
        senderId: payload.me ? "current" : payload.sender?.userId ?? "",
        senderName: payload.sender?.username ?? "",
        senderAvatar: payload.sender?.avatar,
        timestamp: payload.createdDate ?? new Date().toISOString(),
        type: "text",
        isRead: true,
      };

      setMessages((prev) => [...prev, newMsg]);
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === payload.conversationId
            ? {
                ...conv,
                lastMessage: payload.message ?? payload.content ?? "",
                modifiedDate: payload.createdDate ?? new Date().toISOString(),
              }
            : conv
        )
      );
    },
    [activeConversation]
  );

  useSocket(handleIncomingMessage);

  // **CLEAN: Call management**
  const callHookEnabled = currentUserId !== 'default-user-id';
  const {
    incomingCall,
    isCallModalOpen,
    participantName,
    webRTC,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  } = useCall(callHookEnabled ? currentUserId : '');

  // **CLEAN: Handle call start**
  const handleStartCall = useCallback(
    (callType: 'audio' | 'video', participantName?: string) => {
      if (!callHookEnabled) {
        alert('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
        return;
      }
      if (!activeConversation) {
        alert('Vui lòng chọn cuộc trò chuyện trước');
        return;
      }

      const finalParticipantName = participantName || 
                                   activeConversation.participantName || 
                                   'Unknown User';

      startCall(activeConversation.id, callType, finalParticipantName);
    },
    [activeConversation, startCall, callHookEnabled]
  );

  /**
   * Tải danh sách cuộc trò chuyện khi component mount
   */
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await getMyConversations();
        setConversations(data);
      } catch (error) {
        console.error("Error loading conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  /**
   * Xử lý khi chọn một cuộc trò chuyện
   */
  const handleConversationSelect = useCallback(
    async (conversation: Conversation) => {
      const isSearchItem = conversation.id === conversation.participantId;
      setMessages([]);

      if (isSearchItem) {
        try {
          const created = await createConv(conversation.participantId);
          setConversations((prev) => [created, ...prev]);
          setActiveConversation(created);
          setShowConversationList(false);

          const msgs = await getMessages(created.id);
          setMessages(msgs);
          return;
        } catch (e) {
          console.error("Tạo conversation thất bại", e);
          return;
        }
      }

      const existed =
        conversations.find((c) => c.id === conversation.id) ?? conversation;
      setActiveConversation(existed);
      setShowConversationList(false);

      try {
        const msgs = await getMessages(existed.id);
        setMessages(msgs);
      } catch (e) {
        console.error("Tải tin nhắn thất bại", e);
      }
    },
    [conversations]
  );

  /**
   * Xử lý gửi tin nhắn
   */
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeConversation) return;

      try {
        await sendMessage(activeConversation.id, content);
      } catch (e) {
        console.error("Gửi tin nhắn thất bại", e);
      }
    },
    [activeConversation]
  );

  const reloadConversations = async () => {
    const data = await getMyConversations();
    setConversations(data);
  };

  // Hiển thị loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Trò chuyện" description="Trang trò chuyện" />
      
      {/* **CLEAN: Debug info only in development** */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black bg-opacity-80 text-white p-2 rounded text-xs z-50">
          <div>User: {currentUserId}</div>
          <div>Call: {callHookEnabled ? '✅' : '❌'}</div>
        </div>
      )}
      
      <div className="space-y-6">
        <div className="mx-auto w-full max-w-[1500px]">
          <div
            className="flex gap-4 min-w-0"
            style={{ height: "calc(100dvh - 125px)" }}
          >
            {/* Danh sách cuộc trò chuyện */}
            <div
              className={`min-h-0 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden
              w-full lg:w-[380px] ${
                showConversationList ? "flex" : "hidden"
              } lg:flex`}
            >
              <div className="flex-1 min-h-0 overflow-y-auto">
                <ConversationList
                  conversations={conversations}
                  activeConversationId={activeConversation?.id}
                  onConversationSelect={handleConversationSelect}
                  onSearchChange={setSearchTerm}
                  reloadConversations={reloadConversations}
                />
              </div>
            </div>

            {/* Khu vực chat */}
            <div
              className={`min-h-0 flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden
              ${showConversationList ? "hidden" : "flex"} lg:flex`}
            >
              <div className="shrink-0">
                <ChatHeader
                  conversation={activeConversation}
                  onBackToConversations={() => setShowConversationList(true)}
                  onStartCall={handleStartCall}
                  currentUserId={currentUserId}
                />
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 bg-gray-50">
                {activeConversation ? (
                  <div className="space-y-2">
                    {messages.map((m) => (
                      <ChatMessage
                        key={m.id}
                        message={m}
                        isOwnMessage={m.senderId === "current"}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Chọn một cuộc trò chuyện để bắt đầu
                  </div>
                )}
              </div>
              {activeConversation && (
                <MessageInput onSendMessage={handleSendMessage} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals - Only render if call is enabled */}
      {callHookEnabled && (
        <>
          <IncomingCallModal
            callOffer={incomingCall}
            onAccept={acceptCall}
            onReject={rejectCall}
          />

          <CallModal
            isOpen={isCallModalOpen}
            callState={webRTC.state}
            localVideoRef={webRTC.localVideoRef}
            remoteVideoRef={webRTC.remoteVideoRef}
            onToggleVideo={webRTC.toggleVideo}
            onToggleAudio={webRTC.toggleAudio}
            onEndCall={endCall}
            participantName={participantName}
          />
        </>
      )}
    </>
  );
}
