import { useEffect, useMemo, useState } from 'react';
import { Conversation } from '../../types/chat';
import { User } from '../../types/user';
import { searchUsers as searchUsersApi } from '../../services/userService';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onConversationSelect: (conversation: Conversation) => void;
  onSearchChange: (searchTerm: string) => void;
}

/**
 * Component hiển thị danh sách cuộc trò chuyện
 * Bao gồm chức năng tìm kiếm và hiển thị danh sách
 */
export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onConversationSelect,
  onSearchChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Conversation[]>([]);

  /**
   * Format thời gian tin nhắn cuối thành dạng dễ đọc
   */
  const formatTime = (timeString?: string): string => {
    if (!timeString) return '';
    
    const date = new Date(timeString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} phút`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ`;
    return `${Math.floor(diffInMinutes / 1440)} ngày`;
  };

  /**
   * Chuyển đổi User thành Conversation để hiển thị trong kết quả tìm kiếm
   */
  const mapUserToConversation = (user: User): Conversation => {
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return {
      id: user.id, // Tạm dùng id = userId
      participantId: user.id,
      participantName: fullName || user.username,
      participantRole: user.roles?.[0]?.name,
      unreadCount: 0,
      isActive: false,
    };
  };

  /**
   * Tìm kiếm người dùng khi thay đổi từ khóa tìm kiếm
   */
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setSearching(true);
        const users = await searchUsersApi(searchTerm.trim());
        setSearchResults(users.map(mapUserToConversation));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Danh sách để hiển thị: kết quả tìm kiếm hoặc danh sách cuộc trò chuyện
  const listToRender = useMemo(
    () => (searchTerm.trim() ? searchResults : conversations),
    [searchTerm, searchResults, conversations]
  );

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header với tiêu đề và nút menu */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Trò chuyện</h2>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
              onSearchChange(value);
            }}
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              Đang tìm...
            </span>
          )}
        </div>
      </div>

      {/* Danh sách cuộc trò chuyện */}
      <div className="flex-1 overflow-y-auto scrollbar-thin max-h-[calc(100vh-200px)]">
        <div className="min-h-full">
          {listToRender.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                activeConversationId === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => onConversationSelect(conversation)}
            >
              <div className="flex items-center space-x-3">
                {/* Avatar người tham gia với status indicator */}
                <div className="relative w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {conversation.participantAvatar ? (
                    <img
                      src={conversation.participantAvatar}
                      alt={conversation.participantName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg text-gray-600 font-semibold">
                      {conversation.participantName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  
                  {/* Status indicator dot */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Tên người tham gia và thời gian */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {conversation.participantName}
                    </h3>
                    {conversation.lastMessageTime && (
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  
                  {/* Vai trò/tin nhắn cuối và số tin nhắn chưa đọc */}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-500 truncate flex-1">
                      {conversation.lastMessage ? (
                        <span>
                          <span className="font-medium">{conversation.lastMessageSender}: </span>
                          {conversation.lastMessage}
                        </span>
                      ) : (
                        'Chưa có tin nhắn'
                      )}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center flex-shrink-0 ml-2">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Thông báo khi không có cuộc trò chuyện */}
          {listToRender.length === 0 && (
            <div className="p-4 text-sm text-gray-500">Không có cuộc trò chuyện</div>
          )}
        </div>
      </div>
    </div>
  );
};



