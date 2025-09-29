import React from 'react';
import { Conversation } from "../../types/chat";

interface ChatHeaderProps {
  conversation: Conversation | null;
  onStartCall: (callType: 'audio' | 'video', participantName?: string) => void;
  onBackToConversations?: () => void;
}

/**
 * Component hiển thị header của cuộc trò chuyện
 */
export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onStartCall,
  onBackToConversations,
}) => {
  // Hiển thị placeholder khi chưa chọn cuộc trò chuyện
  if (!conversation) {
    return (
      <div className="h-16 border-b border-gray-200 bg-white flex items-center px-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Chọn cuộc trò chuyện
        </h2>
      </div>
    );
  }

  const handleStartCall = (callType: 'audio' | 'video') => {
    // Get participant info from conversation
    const participantName = conversation.participantName;
    onStartCall(callType, participantName);
  };

  return (
    <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      {/* Phần thông tin người tham gia */}
      <div className="flex items-center space-x-3">
        {/* Nút back cho mobile */}
        {onBackToConversations && (
          <button
            className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={onBackToConversations}
            aria-label="Quay lại"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Avatar người tham gia */}
        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
          {conversation.participantAvatar ? (
            <img
              src={conversation.participantAvatar}
              alt={conversation.participantName || 'User'}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <span className="text-xl text-gray-600 font-semibold">
              {(conversation.participantName || 'U').charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Thông tin tên */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {conversation.participantName}
          </h2>
          {conversation.participantRole && (
            <p className="text-sm text-gray-500">
              {conversation.participantRole}
            </p>
          )}
        </div>
      </div>

      {/* Các nút hành động */}
      <div className="hidden md:flex items-center space-x-2">
        {/* Nút gọi điện */}
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          onClick={() => handleStartCall('audio')}
          title="Gọi điện"
        >
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </button>

        {/* Nút gọi video */}
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          onClick={() => handleStartCall('video')}
          title="Gọi video"
        >
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>

        {/* Nút menu */}
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
