import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { User } from "../../types/user";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  setGroupName: (v: string) => void;
  groupAvatar: string;
  setGroupAvatar: (v: string) => void;
  allUsers: User[];
  selectedUsers: User[];
  handleUserSelect: (user: User) => void;
  handleSave: () => void;
}

export default function GroupModal({
  isOpen,
  onClose,
  groupName,
  setGroupName,
  groupAvatar,
  setGroupAvatar,
  allUsers,
  selectedUsers,
  handleUserSelect,
  handleSave,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] m-4">
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Tạo nhóm trò chuyện
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Nhập thông tin nhóm để bắt đầu trò chuyện nhóm.
          </p>
        </div>
        <form
          className="flex flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="custom-scrollbar h-[270px] overflow-y-auto px-2 pb-3">
            <Label>Tên nhóm</Label>
            <Input
              type="text"
              placeholder="Nhập tên nhóm..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <Label className="mt-2">Avatar nhóm (URL)</Label>
            <Input
              type="text"
              placeholder="Nhập link ảnh nhóm..."
              value={groupAvatar}
              onChange={(e) => setGroupAvatar(e.target.value)}
            />
            <Label className="mt-2">Chọn thành viên</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {allUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className={`px-2 py-1 rounded border ${
                    selectedUsers.some((u) => u.id === user.id)
                      ? "bg-blue-100 border-blue-400"
                      : "bg-gray-100 border-gray-300"
                  }`}
                  onClick={() => handleUserSelect(user)}
                >
                  {`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <Button size="sm" type="submit">
              Tạo nhóm
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}