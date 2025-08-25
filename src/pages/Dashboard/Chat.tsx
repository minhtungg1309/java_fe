import { useState, useEffect, useCallback } from 'react';
import { ConversationList } from '../../components/chat/ConversationList';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { MessageInput } from '../../components/chat/MessageInput';
import { Conversation, ChatMessage as ChatMessageType } from '../../types/chat';
import PageMeta from '../../components/common/PageMeta';
import { getMyConversations, createConversation as createConv, getMessages, sendMessage } from '../../services/chatService';
import { useSocket } from '../../hooks/useSocket';

/**
 * Trang chính của tính năng chat
 * Quản lý danh sách cuộc trò chuyện, tin nhắn và giao diện chat
 */
export default function Chat() {
  // State quản lý dữ liệu
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setSearchTerm] = useState('');
  const [showConversationList, setShowConversationList] = useState(true);

  /**
   * Tải danh sách cuộc trò chuyện khi component mount
   */
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await getMyConversations();
        setConversations(data);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadConversations();
  }, []);

  /**
   * Xử lý khi chọn một cuộc trò chuyện
   * Hỗ trợ tạo cuộc trò chuyện mới hoặc chọn cuộc trò chuyện có sẵn
   */
  const handleConversationSelect = useCallback(async (conversation: Conversation) => {
    const isSearchItem = conversation.id === conversation.participantId;
    setMessages([]); // Xóa tin nhắn cũ khi chuyển cuộc trò chuyện

    // Xử lý tạo cuộc trò chuyện mới từ kết quả tìm kiếm
    if (isSearchItem) {
      try {
        const created = await createConv(conversation.participantId);
        setConversations(prev => [created, ...prev]);
        setActiveConversation(created);
        setShowConversationList(false);
        
        const msgs = await getMessages(created.id);
        setMessages(msgs);
        return;
      } catch (e) {
        console.error('Tạo conversation thất bại', e);
        return;
      }
    }

    // Xử lý chọn cuộc trò chuyện có sẵn
    const existed = conversations.find(c => c.id === conversation.id) ?? conversation;
    setActiveConversation(existed);
    setShowConversationList(false);
    
    try {
      const msgs = await getMessages(existed.id);
      setMessages(msgs);
    } catch (e) {
      console.error('Tải tin nhắn thất bại', e);
    }
  }, [conversations]);

  /**
   * Xử lý gửi tin nhắn
   * Tin nhắn sẽ được thêm vào danh sách qua socket event
   */
  const handleSendMessage = useCallback(async (content: string) => {
    if (!activeConversation) return;
    
    try {
      await sendMessage(activeConversation.id, content);
      // Không cần thêm tin nhắn vào state ở đây
      // Tin nhắn sẽ được thêm qua socket event từ server
    } catch (e) {
      console.error('Gửi tin nhắn thất bại', e);
    }
  }, [activeConversation]);

  /**
   * Xử lý tin nhắn đến từ socket
   * Chỉ xử lý tin nhắn của cuộc trò chuyện đang active
   */
  const handleIncomingMessage = useCallback((payload: import('../../hooks/useSocket').IncomingMessage) => {
    if (!activeConversation) return;
    if (payload?.conversationId !== activeConversation.id) return;

    const newMsg: ChatMessageType = {
      id: payload.id,
      content: payload.message ?? payload.content ?? '',
      senderId: payload.me ? 'current' : (payload.sender?.userId ?? ''),
      senderName: payload.sender?.username ?? '',
      senderAvatar: payload.sender?.avatar, // Đảm bảo avatar được truyền
      timestamp: payload.createdDate ?? new Date().toISOString(),
      type: 'text',
      isRead: true,
    };

    setMessages(prev => [...prev, newMsg]);
  }, [activeConversation]);

  // Kết nối socket để nhận tin nhắn real-time
  useSocket(handleIncomingMessage);

  // Hiển thị loading khi đang tải dữ liệu
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
      <div className="space-y-6">
        <div className="mx-auto w-full max-w-[1500px]"> 
          {/* Khung chiếm gần full màn hình nhưng không làm cuộn toàn trang */}
          <div
            className="flex gap-4 min-w-0"
            style={{ height: 'calc(100dvh - 150px)' }}
          >
            {/* Danh sách cuộc trò chuyện */}
            <div
              className={`min-h-0 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden
              w-full lg:w-[380px] ${showConversationList ? 'flex' : 'hidden'} lg:flex`}
            >
              <div className="flex-1 min-h-0 overflow-y-auto">
                <ConversationList
                  conversations={conversations}
                  activeConversationId={activeConversation?.id}
                  onConversationSelect={handleConversationSelect}
                  onSearchChange={setSearchTerm}
                />
              </div>
            </div>

            {/* Khu vực chat */}
            <div
              className={`min-h-0 flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden
              ${showConversationList ? 'hidden' : 'flex'} lg:flex`}
            >
              <div className="shrink-0">
                <ChatHeader
                  conversation={activeConversation}
                  onBackToConversations={() => setShowConversationList(true)}
                />
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 bg-gray-50">
                {activeConversation ? (
                  <div className="space-y-2">
                    {messages.map((m) => (
                      <ChatMessage
                        key={m.id}
                        message={m}
                        isOwnMessage={m.senderId === 'current'}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Chọn một cuộc trò chuyện để bắt đầu
                  </div>
                )}
              </div>
              {activeConversation && <MessageInput onSendMessage={handleSendMessage} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
