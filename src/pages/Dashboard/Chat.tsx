import { useState, useEffect, useCallback } from 'react';
import { ConversationList } from '../../components/chat/ConversationList';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { MessageInput } from '../../components/chat/MessageInput';
import { Conversation, ChatMessage as ChatMessageType } from '../../types/chat';
import PageMeta from '../../components/common/PageMeta';

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConversationList, setShowConversationList] = useState(true);

  // Mock data for demo
  const mockConversations: Conversation[] = [
    {
      id: '1',
      participantId: '1',
      participantName: 'Quản lý dự án',
      participantRole: 'Project Manager',
      lastMessage: 'Dự án đã hoàn thành',
      lastMessageTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    {
      id: '2',
      participantId: '2',
      participantName: 'Lindsey Curtis',
      participantRole: 'Nhà thiết kế - Designer',
      lastMessage: 'Tôi muốn đặt lịch hẹn vào ngày mai từ 2:00 đến 5:00 chiều?',
      lastMessageTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      unreadCount: 2,
      isActive: true,
    },
    {
      id: '3',
      participantId: '3',
      participantName: 'Zain Geidt',
      participantRole: 'Người viết nội dung - Content Writer',
      lastMessage: 'Nội dung đã được cập nhật',
      lastMessageTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      unreadCount: 1,
    },
    {
      id: '4',
      participantId: '4',
      participantName: 'Carla George',
      participantRole: 'Nhà phát triển Front-end - Front-end Developer',
      lastMessage: 'Code đã được review',
      lastMessageTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    {
      id: '5',
      participantId: '5',
      participantName: 'Abram Schleifer',
      participantRole: 'Nhà tiếp thị kỹ thuật số - Digital Marketer',
      lastMessage: 'Chiến dịch marketing đã sẵn sàng',
      lastMessageTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    {
      id: '6',
      participantId: '6',
      participantName: 'Lincoln Donin',
      participantRole: 'Quản lý dự án Thiết kế sản phẩm - Product Design Project Manager',
      lastMessage: 'Thiết kế đã được phê duyệt',
      lastMessageTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    {
      id: '7',
      participantId: '7',
      participantName: 'Erin Geidthem',
      participantRole: 'Người giữ bản quyền - Copyright Holder',
      lastMessage: 'Bản quyền đã được đăng ký',
      lastMessageTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    {
      id: '8',
      participantId: '8',
      participantName: 'Alena Baptista',
      participantRole: 'Chuyên gia SEO - SEO Specialist',
      lastMessage: 'SEO đã được tối ưu',
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    {
      id: '9',
      participantId: '9',
      participantName: 'Wilium vamos',
      participantRole: 'Người viết nội dung - Content Writer',
      lastMessage: 'Nội dung mới đã được viết',
      lastMessageTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    // Thêm nhiều conversations mẫu để test scrolling
    {
      id: '10',
      participantId: '10',
      participantName: 'John Smith',
      participantRole: 'Backend Developer',
      lastMessage: 'API đã được cập nhật',
      lastMessageTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    {
      id: '11',
      participantId: '11',
      participantName: 'Sarah Johnson',
      participantRole: 'UI/UX Designer',
      lastMessage: 'Thiết kế mới đã hoàn thành',
      lastMessageTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    {
      id: '12',
      participantId: '12',
      participantName: 'Mike Wilson',
      participantRole: 'DevOps Engineer',
      lastMessage: 'Deployment thành công',
      lastMessageTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    {
      id: '13',
      participantId: '13',
      participantName: 'Emily Davis',
      participantRole: 'Product Manager',
      lastMessage: 'Sprint planning đã sẵn sàng',
      lastMessageTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    {
      id: '14',
      participantId: '14',
      participantName: 'David Brown',
      participantRole: 'QA Tester',
      lastMessage: 'Testing đã hoàn thành',
      lastMessageTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    {
      id: '15',
      participantId: '15',
      participantName: 'Lisa Anderson',
      participantRole: 'Business Analyst',
      lastMessage: 'Requirements đã được review',
      lastMessageTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    {
      id: '16',
      participantId: '16',
      participantName: 'Tom Martinez',
      participantRole: 'System Architect',
      lastMessage: 'Architecture đã được phê duyệt',
      lastMessageTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    {
      id: '17',
      participantId: '17',
      participantName: 'Anna Taylor',
      participantRole: 'Data Scientist',
      lastMessage: 'Model đã được train xong',
      lastMessageTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    {
      id: '18',
      participantId: '18',
      participantName: 'Chris Lee',
      participantRole: 'Mobile Developer',
      lastMessage: 'App đã được release',
      lastMessageTime: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    {
      id: '19',
      participantId: '19',
      participantName: 'Rachel Green',
      participantRole: 'Marketing Manager',
      lastMessage: 'Campaign đã được launch',
      lastMessageTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
    {
      id: '20',
      participantId: '20',
      participantName: 'Kevin White',
      participantRole: 'Sales Representative',
      lastMessage: 'Deal đã được đóng',
      lastMessageTime: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    },
  ];

  const mockMessages: ChatMessageType[] = [
    {
      id: '1',
      content: 'Tôi muốn đặt lịch hẹn vào ngày mai từ 2:00 đến 5:00 chiều?',
      senderId: '2',
      senderName: 'Lindsey',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true,
    },
    {
      id: '2',
      content: 'Nếu không thích điều gì đó, tôi sẽ tránh xa nó.',
      senderId: 'current',
      senderName: 'Bạn',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true,
    },
    {
      id: '3',
      content: 'Nếu không thích điều gì đó, tôi sẽ tránh xa nó.',
      senderId: 'current',
      senderName: 'Bạn',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true,
    },
    {
      id: '4',
      content: 'Họ đến đó sớm và có được chỗ ngồi thực sự tốt.',
      senderId: 'current',
      senderName: 'Bạn',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true,
    },
    {
      id: '5',
      content: 'Tôi muốn biết thông tin chi tiết hơn.',
      senderId: '2',
      senderName: 'Lindsey',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true,
    },
    {
      id: '6',
      content: '',
      senderId: '2',
      senderName: 'Lindsey',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      type: 'image',
      imageUrl: '/src/assets/images/carousel/carousel-01.png',
      isRead: true,
    },
    // Thêm nhiều tin nhắn mẫu để test scrolling
    {
      id: '7',
      content: 'Tin nhắn cũ 1 - Đây là tin nhắn để test scrolling',
      senderId: 'current',
      senderName: 'Bạn',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true,
    },
    {
      id: '8',
      content: 'Tin nhắn cũ 2 - Scrolling hoạt động tốt',
      senderId: '2',
      senderName: 'Lindsey',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true,
    },
    {
      id: '9',
      content: 'Tin nhắn cũ 3 - Có thể scroll xem tin nhắn cũ',
      senderId: 'current',
      senderName: 'Bạn',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true,
    },
    {
      id: '10',
      content: 'Tin nhắn cũ 4 - Danh sách trò chuyện cũng có thể scroll',
      senderId: '2',
      senderName: 'Lindsey',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true,
    },
    {
      id: '11',
      content: 'Tin nhắn cũ 5 - Layout responsive hoạt động tốt',
      senderId: 'current',
      senderName: 'Bạn',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true,
    },
    {
      id: '12',
      content: 'Tin nhắn cũ 6 - Giao diện chat đẹp và hiện đại',
      senderId: '2',
      senderName: 'Lindsey',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true,
    },
    {
      id: '13',
      content: 'Tin nhắn cũ 7 - Có thể xem lịch sử tin nhắn',
      senderId: 'current',
      senderName: 'Bạn',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true,
    },
    {
      id: '14',
      content: 'Tin nhắn cũ 8 - Scrollbar mỏng và đẹp mắt',
      senderId: '2',
      senderName: 'Lindsey',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true,
    },
    {
      id: '15',
      content: 'Tin nhắn cũ 9 - Tỷ lệ layout 1:3 hoạt động tốt',
      senderId: 'current',
      senderName: 'Bạn',
      timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true,
    },
    {
      id: '16',
      content: 'Tin nhắn cũ 10 - Có thể scroll xem 100+ tin nhắn',
      senderId: '2',
      senderName: 'Lindsey',
      timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true,
    },
  ];

  useEffect(() => {
    // Load conversations
    const loadConversations = async () => {
      try {
        // Simulate loading
        setTimeout(() => {
          setConversations(mockConversations);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error loading conversations:', error);
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  const handleConversationSelect = useCallback(async (conversation: Conversation) => {
    setActiveConversation(conversation);
    setShowConversationList(false); // Hide conversation list on mobile when selecting
    
    try {
      // Simulate loading messages
      setTimeout(() => {
        setMessages(mockMessages);
        
        // Mark as read
        if (conversation.unreadCount > 0) {
          setConversations(prev => 
            prev.map(conv => 
              conv.id === conversation.id 
                ? { ...conv, unreadCount: 0 }
                : conv
            )
          );
        }
      }, 300);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!activeConversation) return;

    const newMessage: ChatMessageType = {
      id: Date.now().toString(),
      content,
      senderId: 'current',
      senderName: 'Bạn',
      timestamp: new Date().toISOString(),
      type: 'text',
      isRead: false,
    };

    setMessages(prev => [...prev, newMessage]);

    // Update conversation last message
    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeConversation.id 
          ? { 
              ...conv, 
              lastMessage: content,
              lastMessageTime: new Date().toISOString(),
              unreadCount: 0
            }
          : conv
      )
    );
  }, [activeConversation]);

  const filteredConversations = conversations.filter(conversation =>
    conversation.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.participantRole?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Trò chuyện" description="Trang trò chuyện" />
      
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-80px)]">

        {/* Conversation List Card - 1/4 width */}
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col lg:col-span-1 ${
          showConversationList ? 'block' : 'hidden lg:block'
        }`}>
          <ConversationList
            conversations={filteredConversations}
            activeConversationId={activeConversation?.id}
            onConversationSelect={handleConversationSelect}
            onSearchChange={setSearchTerm}
          />
        </div>

        {/* Chat Area Card - 3/4 width */}
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col lg:col-span-3 ${
          !showConversationList || activeConversation ? 'block' : 'hidden lg:block'
        }`}>
          {/* Mobile Header with back button */}
          <div className="lg:hidden border-b border-gray-200 bg-white px-4 py-3 flex-shrink-0">
            {activeConversation ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowConversationList(true)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {activeConversation.participantAvatar ? (
                          <img
                            src={activeConversation.participantAvatar}
                            alt={activeConversation.participantName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-semibold text-sm">
                            {activeConversation.participantName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Online status dot */}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {activeConversation.participantName}
                      </h3>
                      {activeConversation.participantRole && (
                        <p className="text-xs text-gray-500">{activeConversation.participantRole}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Trò chuyện</h2>
                <button
                  onClick={() => setShowConversationList(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Chat Header */}
          <div className="hidden lg:block">
            <ChatHeader conversation={activeConversation} />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50 scrollbar-thin max-h-[calc(100vh-300px)]">
            {activeConversation ? (
              <div className="space-y-2 min-h-full">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isOwnMessage={message.senderId === 'current'}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Chọn cuộc trò chuyện
                  </h3>
                  <p className="text-gray-500">
                    Chọn một cuộc trò chuyện từ danh sách để bắt đầu nhắn tin
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          {activeConversation && (
            <MessageInput onSendMessage={handleSendMessage} />
          )}
        </div>
      </div>
    </>
  );
}
