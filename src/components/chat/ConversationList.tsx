import { useEffect, useMemo, useState } from "react";
import { Conversation } from "../../types/chat";
import { User } from "../../types/user";
import { searchUsers as searchUsersApi } from "../../services/userService";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { useModal } from "../../hooks/useModal.ts";
import { Modal } from "../ui/modal.tsx";
import Button from "../ui/button/Button.tsx";
import Input from "../form/input/InputField.tsx";
import Label from "../form/Label.tsx";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onConversationSelect: (conversation: Conversation) => void;
  onSearchChange: (searchTerm: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onConversationSelect,
  onSearchChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Conversation[]>([]);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  // Format thời gian tin nhắn cuối
  const formatTime = (timeString?: string): string => {
    if (!timeString) return "";
    const date = new Date(timeString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );
    if (diffInMinutes < 60) return `${diffInMinutes} phút`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ`;
    return `${Math.floor(diffInMinutes / 1440)} ngày`;
  };

  // Chuyển đổi User thành Conversation
  const mapUserToConversation = (user: User): Conversation => {
    const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    return {
      id: user.id,
      participantId: user.id,
      participantName: fullName || user.username,
      participantRole: user.roles?.[0]?.name,
      unreadCount: 0,
      isActive: false,
    };
  };

  // Tìm kiếm người dùng
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

  // Danh sách hiển thị: tìm kiếm hoặc tất cả
  const listToRender = useMemo(
    () => (searchTerm.trim() ? searchResults : conversations),
    [searchTerm, searchResults, conversations]
  );

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClick = () => setMenuOpenId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // Xử lý lưu modal
  const handleSave = () => {
    // Logic lưu thông tin nhóm
    closeModal();
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Trò chuyện</h2>
          <div className="relative inline-block">
            <button
              className="dropdown-toggle"
              onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
            >
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
            </button>
            <Dropdown
              isOpen={headerDropdownOpen}
              onClose={() => setHeaderDropdownOpen(false)}
              className="w-40 p-2"
            >
              <DropdownItem
                onItemClick={openModal}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Tạo Nhóm
              </DropdownItem>
            </Dropdown>
          </div>
          <Modal
            isOpen={isOpen}
            onClose={closeModal}
            className="max-w-[700px] m-4"
          >
            {/* Nội dung modal tạo nhóm */}
            <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
              <div className="px-2 pr-14">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                  Tạo nhóm trò chuyện
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                  Nhập thông tin nhóm để bắt đầu trò chuyện nhóm.
                </p>
              </div>
              <form className="flex flex-col">
                {/* Thêm các trường tạo nhóm ở đây */}
                <div className="custom-scrollbar h-[200px] overflow-y-auto px-2 pb-3">
                  <Label>Tên nhóm</Label>
                  <Input type="text" placeholder="Nhập tên nhóm..." />
                  {/* Có thể thêm chọn thành viên ở đây */}
                </div>
                <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                  <Button size="sm" variant="outline" onClick={closeModal}>
                    Đóng
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Tạo nhóm
                  </Button>
                </div>
              </form>
            </div>
          </Modal>
        </div>
        {/* Ô tìm kiếm */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
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
                activeConversationId === conversation.id
                  ? "bg-blue-50 border-l-4 border-l-blue-500"
                  : ""
              }`}
              onClick={() => onConversationSelect(conversation)}
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
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
                  {/* Status indicator */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  {/* Tên và thời gian */}
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
                  {/* Tin nhắn cuối và số tin chưa đọc */}
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
                {/* Menu ba chấm cho từng conversation */}
                <div className="relative">
                  <button
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(
                        conversation.id === menuOpenId ? null : conversation.id
                      );
                    }}
                  >
                    <MoreDotIcon className="w-5 h-5 text-gray-500" />
                  </button>
                  {menuOpenId === conversation.id && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-10">
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Xử lý View More
                          alert(`View More: ${conversation.participantName}`);
                          setMenuOpenId(null);
                        }}
                      >
                        View More
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Xử lý Delete
                          alert(`Delete: ${conversation.participantName}`);
                          setMenuOpenId(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {/* Không có cuộc trò chuyện */}
          {listToRender.length === 0 && (
            <div className="p-4 text-sm text-gray-500">
              Không có cuộc trò chuyện
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
