import { useEffect, useMemo, useState } from "react";
import { Conversation } from "../../types/chat";
import {
  searchUsers as searchUsersApi,
  getUsers,
} from "../../services/userService";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { useModal } from "../../hooks/useModal.ts";
import { createConversation } from "../../services/chatService"; // Thêm import
import { User } from "../../types/user"; // Đã có
import ConversationItem from "./ConversationItem";
import GroupModal from "./GroupModal";
import toast from 'react-hot-toast';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onConversationSelect: (conversation: Conversation) => void;
  reloadConversations: () => Promise<void>; // thêm prop này
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onConversationSelect,
  reloadConversations, // nhận prop này
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Conversation[]>([]);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  // Thêm state cho các trường tạo nhóm
  const [groupName, setGroupName] = useState("");
  const [groupAvatar, setGroupAvatar] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

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

  // Hàm xử lý chọn thành viên (ví dụ: checkbox hoặc multi-select)
  const handleUserSelect = (user: User) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  // Hàm tạo nhóm
  const handleSave = async () => {
    if (!groupName || selectedUsers.length < 2) {
      toast.error('Tên nhóm và ít nhất 2 thành viên là bắt buộc!');
      return;
    }
    try {
      await createConversation(
        selectedUsers.map((u) => u.id),
        "GROUP",
        groupName,
        groupAvatar
      );
      // Gọi lại API để cập nhật danh sách cuộc trò chuyện
      await reloadConversations(); // <-- cập nhật danh sách mới
      closeModal();
      setGroupName("");
      setGroupAvatar("");
      setSelectedUsers([]);
      toast.success('Tạo nhóm thành công!');
    } catch (err) {
      toast.error('Nhóm đã tồn tại hoặc có lỗi xảy ra!');
      throw err;
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Khi mở modal thì load tất cả user
      getUsers()
        .then(setAllUsers)
        .catch(() => setAllUsers([]));
    }
  }, [isOpen]);

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
          <GroupModal
            isOpen={isOpen}
            onClose={closeModal}
            groupName={groupName}
            setGroupName={setGroupName}
            groupAvatar={groupAvatar}
            setGroupAvatar={setGroupAvatar}
            allUsers={allUsers}
            selectedUsers={selectedUsers}
            handleUserSelect={handleUserSelect}
            handleSave={handleSave}
          />
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
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              active={activeConversationId === conversation.id}
              onSelect={() => onConversationSelect(conversation)}
              menuOpen={menuOpenId === conversation.id}
              onMenuOpen={() =>
                setMenuOpenId(
                  conversation.id === menuOpenId ? null : conversation.id
                )
              }
              onViewMore={() => {
                alert(`View More: ${conversation.participantName}`);
                setMenuOpenId(null);
              }}
              onDelete={() => {
                alert(`Delete: ${conversation.participantName}`);
                setMenuOpenId(null);
              }}
              formatTime={formatTime}
            />
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
