import { ChatMessage as ChatMessageType } from '../../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  isOwnMessage: boolean;
}

/**
 * Component hiển thị một tin nhắn chat
 * Hỗ trợ hiển thị tin nhắn văn bản và hình ảnh
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage }) => {
  /**
   * Format thời gian tin nhắn thành dạng dễ đọc
   * @param timeString - Chuỗi thời gian ISO
   * @returns Chuỗi thời gian đã format
   */
  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    
    // Tin nhắn vừa gửi (< 1 phút)
    if (diffInMs < 60000) {
      return 'Vừa xong';
    }
    
    // Tin nhắn trong vòng 1 giờ
    if (diffInMs < 3600000) {
      const minutes = Math.floor(diffInMs / 60000);
      return `${minutes} phút trước`;
    }
    
    // Tin nhắn trong vòng 1 ngày
    if (diffInMs < 86400000) {
      const hours = Math.floor(diffInMs / 3600000);
      return `${hours} giờ trước`;
    }
    
    // Tin nhắn cũ hơn - hiển thị ngày/tháng
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2 px-2 md:px-0`}>
      <div className={`max-w-[280px] sm:max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Hiển thị avatar và tên người gửi (chỉ cho tin nhắn của người khác) */}
               {/* Hiển thị avatar và tên người gửi (chỉ cho tin nhắn của người khác) */}
               {!isOwnMessage && (
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
              {message.senderAvatar ? (
                <img
                  src={message.senderAvatar}
                  alt={message.senderName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm text-gray-600 font-semibold">
                  {message.senderName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">{message.senderName}</span>
          </div>
        )}
        
        {/* Nội dung tin nhắn */}
        <div
          className={`rounded-lg px-3 py-2 sm:px-4 sm:py-2 shadow-sm ${
            isOwnMessage
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {/* Hiển thị tin nhắn hình ảnh */}
          {message.type === 'image' && message.imageUrl ? (
            <div>
              <img
                src={message.imageUrl}
                alt="Message image"
                className="rounded-lg max-w-full h-auto"
              />
              <p className="text-xs mt-1 opacity-75">Vui lòng xem trước hình ảnh</p>
            </div>
          ) : (
            /* Hiển thị tin nhắn văn bản */
            <p className="text-sm leading-relaxed">{message.content}</p>
          )}
        </div>
        
        {/* Thời gian tin nhắn */}
        <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};
