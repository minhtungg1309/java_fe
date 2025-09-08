import { Conversation } from "../../types/chat";
import { MoreDotIcon } from "../../icons";

interface Props {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
  menuOpen: boolean;
  onMenuOpen: () => void;
  onViewMore: () => void;
  onDelete: () => void;
  formatTime: (timeString?: string) => string;
}

export default function ConversationItem({
  conversation,
  active,
  onSelect,
  menuOpen,
  onMenuOpen,
  onViewMore,
  onDelete,
  formatTime,
}: Props) {
  return (
    <div
      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
        active ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center space-x-3">
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
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div className="flex-1 min-w-0">
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
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-gray-500 truncate flex-1">
              {conversation.lastMessage ? (
                <span>
                  <span className="font-medium">
                    {conversation.lastMessageSender}:{" "}
                  </span>
                  {conversation.lastMessage}
                </span>
              ) : (
                "Chưa có tin nhắn"
              )}
            </p>
            {conversation.unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center flex-shrink-0 ml-2">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
        <div className="relative">
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onMenuOpen();
            }}
          >
            <MoreDotIcon className="w-5 h-5 text-gray-500" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-10">
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewMore();
                }}
              >
                View More
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}