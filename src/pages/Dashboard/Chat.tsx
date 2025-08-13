import { useState, useEffect, useCallback } from 'react';
import { ConversationList } from '../../components/chat/ConversationList';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { MessageInput } from '../../components/chat/MessageInput';
import { Conversation, ChatMessage as ChatMessageType } from '../../types/chat';
import PageMeta from '../../components/common/PageMeta';
import { getMyConversations, createConversation as createConv, getMessages, sendMessage } from '../../services/chatService';
import { useSocket } from '../../hooks/useSocket';

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setSearchTerm] = useState('');
  const [showConversationList, setShowConversationList] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyConversations();
        setConversations(data);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleConversationSelect = useCallback(async (conversation: Conversation) => {
    const isSearchItem = conversation.id === conversation.participantId;
    setMessages([]); // clear tạm thời khi chuyển cuộc trò chuyện

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

  const handleSendMessage = useCallback(async (content: string) => {
    if (!activeConversation) return;
    try {
      await sendMessage(activeConversation.id, content);
      // Bỏ dòng này: setMessages(prev => [...prev, newMsg]);
      // Tin nhắn sẽ được thêm qua socket event
    } catch (e) {
      console.error('Gửi tin nhắn thất bại', e);
    }
  }, [activeConversation]);

  const handleIncomingMessage = useCallback((payload: import('../../hooks/useSocket').IncomingMessage) => {
    if (!activeConversation) return;
    if (payload?.conversationId !== activeConversation.id) return;

    const newMsg: ChatMessageType = {
      id: payload.id,
      content: payload.message ?? payload.content ?? '',
      senderId: payload.me ? 'current' : (payload.sender?.userId ?? ''),
      senderName: payload.sender?.username ?? '',
      timestamp: payload.createdDate ?? new Date().toISOString(),
      type: 'text',
      isRead: true,
    };

    setMessages(prev => [...prev, newMsg]);
  }, [activeConversation]);

  useSocket(handleIncomingMessage);

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
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-80px)]">
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col lg:col-span-1 ${
          showConversationList ? 'block' : 'hidden lg:block'
        }`}>
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversation?.id}
            onConversationSelect={handleConversationSelect}
            onSearchChange={setSearchTerm}
          />
        </div>

        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col lg:col-span-3 ${
          !showConversationList || activeConversation ? 'block' : 'hidden lg:block'
        }`}>
          <div className="hidden lg:block">
            <ChatHeader conversation={activeConversation} />
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50 scrollbar-thin max-h-[calc(100vh-300px)]">
            {activeConversation ? (
              <div className="space-y-2 min-h-full">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} isOwnMessage={message.senderId === 'current'} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">Chọn một cuộc trò chuyện để bắt đầu</div>
              </div>
            )}
          </div>

          {activeConversation && <MessageInput onSendMessage={handleSendMessage} />}
        </div>
      </div>
    </>
  );
}
