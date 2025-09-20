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
export default function Chat() {
  // State quản lý dữ liệu
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setSearchTerm] = useState("");
  const [showConversationList, setShowConversationList] = useState(true);

  // **FIXED: Better User ID Detection**
  const getCurrentUserId = (): string => {
    console.log('🔍 Detecting user ID...');
    
    try {
      // **Method 1: From JWT Token**
      const token = getToken();
      console.log('Token exists:', !!token);
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('Token payload:', payload);
          
          const userId = payload.sub || payload.userId || payload.user_id || payload.username;
          if (userId && userId !== 'default-user-id') {
            console.log('✅ User ID from token:', userId);
            return userId;
          }
        } catch (tokenError) {
          console.error('Token parse error:', tokenError);
        }
      }

      // **Method 2: From localStorage user object**
      const userStr = localStorage.getItem('user');
      console.log('User string exists:', !!userStr);
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log('User object:', user);
          
          const userId = user.id || user.userId || user.username;
          if (userId && userId !== 'default-user-id') {
            console.log('✅ User ID from user object:', userId);
            return userId;
          }
        } catch (userError) {
          console.error('User parse error:', userError);
        }
      }

      // **Method 3: Direct from localStorage**
      const directUserId = localStorage.getItem('userId') || localStorage.getItem('username');
      console.log('Direct user ID:', directUserId);
      
      if (directUserId && directUserId !== 'default-user-id') {
        console.log('✅ User ID from direct storage:', directUserId);
        return directUserId;
      }

      // **Method 4: Check all localStorage keys for user info**
      console.log('🔍 All localStorage keys:', Object.keys(localStorage));
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          console.log(`localStorage[${key}]:`, value?.substring(0, 100));
        }
      }

    } catch (error) {
      console.error('Error detecting user ID:', error);
    }
    
    console.error('❌ Could not get valid user ID, using default');
    return 'default-user-id';
  };

  // **MEMO để tránh re-calculation**
  const currentUserId = React.useMemo(() => getCurrentUserId(), []);
  console.log('Final Current User ID:', currentUserId);

  /**
   * Xử lý tin nhắn đến từ socket
   */
  const handleIncomingMessage = useCallback(
    (payload: import("../../hooks/useSocket").IncomingMessage) => {
      if (!activeConversation) return;
      if (payload?.conversationId !== activeConversation.id) return;

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

  // Kết nối socket cho chat messages
  useSocket(handleIncomingMessage);

  // Call management - **Only call if we have valid user ID**
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

  /**
   * Handle call start with proper validation
   */
  const handleStartCall = useCallback(
    (callType: 'audio' | 'video', participantName?: string) => {
      // **Validate user session first**
      if (!callHookEnabled) {
        alert('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
        console.error('❌ Cannot start call: Invalid user session');
        return;
      }

      if (!activeConversation) {
        alert('Vui lòng chọn cuộc trò chuyện trước');
        return;
      }

      // Get target user ID from conversation participants
      const targetUserId = activeConversation.participants?.find(
        p => p.userId !== currentUserId
      )?.userId || activeConversation.participantId;

      if (!targetUserId) {
        alert('Không thể xác định người nhận cuộc gọi');
        return;
      }

      const finalParticipantName = participantName || 
                                   activeConversation.participantName || 
                                   'Unknown User';

      console.log('🚀 Starting call with validated data:', {
        currentUserId,
        targetUserId,
        callType,
        participantName: finalParticipantName,
        callHookEnabled
      });

      startCall(targetUserId, callType, finalParticipantName);
    },
    [activeConversation, currentUserId, startCall, callHookEnabled]
  );

  // **Show user session warning**
  if (!callHookEnabled) {
    console.warn('⚠️ Call functionality disabled due to invalid user session');
  }

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
      
      {/* **User Session Debug Info** */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black bg-opacity-80 text-white p-2 rounded text-xs z-50">
          <div>User ID: {currentUserId}</div>
          <div>Call Enabled: {callHookEnabled ? '✅' : '❌'}</div>
          <div>Token: {getToken() ? '✅' : '❌'}</div>
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
