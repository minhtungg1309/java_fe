import { ChatMessage as ChatMessageType } from '../../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  isOwnMessage: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage }) => {
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    
    if (diffInMs < 60000) { // < 1 phút
      return 'Vừa xong';
    } else if (diffInMs < 3600000) { // < 1 giờ
      const minutes = Math.floor(diffInMs / 60000);
      return `${minutes} phút trước`;
    } else if (diffInMs < 86400000) { // < 1 ngày
      const hours = Math.floor(diffInMs / 3600000);
      return `${hours} giờ trước`;
    } else {
      // Hiển thị ngày/tháng cho tin nhắn cũ
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[280px] sm:max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {!isOwnMessage && (
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
              {message.senderAvatar ? (
                <img
                  src={message.senderAvatar}
                  alt={message.senderName}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-600 font-semibold">
                  {message.senderName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">{message.senderName}</span>
          </div>
        )}
        
        <div
          className={`rounded-lg px-3 py-2 sm:px-4 sm:py-2 shadow-sm ${
            isOwnMessage
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
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
            <p className="text-sm leading-relaxed">{message.content}</p>
          )}
        </div>
        
        <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};
