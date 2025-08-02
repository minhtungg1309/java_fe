import { useState, useEffect, useCallback } from "react";
import {
  createUser,
  getUsers,
  deleteUser,
  updateUser,
  User,
  CreateUserRequest,
  UpdateUserRequest,
} from "../../services/userService.ts";
import toast from "react-hot-toast";

// Custom hook for user management
const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
      setError("");
    } catch (err) {
      setError("Không thể lấy danh sách người dùng!");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addUser = useCallback(async (userData: CreateUserRequest) => {
    try {
      setLoading(true);
      const newUser = await createUser(userData);
      setUsers(prevUsers => [...prevUsers, newUser]);
      toast.success("Tạo người dùng thành công!");
      return newUser;
    } catch (err) {
      console.error("Error creating user:", err);
      toast.error("Tạo người dùng thất bại!");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserInList = useCallback(async (id: string | number, userData: Partial<UpdateUserRequest>) => {
    try {
      setLoading(true);
      const updatedUser = await updateUser(id, userData);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id == id 
            ? updatedUser
            : user
        )
      );
      toast.success("Cập nhật người dùng thành công!");
    } catch (err) {
      console.error("Error updating user:", err);
      toast.error("Cập nhật người dùng thất bại!");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeUser = useCallback(async (id: string | number) => {
    try {
      await deleteUser(id);
      setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
      toast.success("Xóa người dùng thành công!");
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error("Xóa người dùng thất bại!");
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    addUser,
    updateUserInList,
    removeUser,
    fetchUsers,
  };
};

// Custom hook for form management
const useFormManagement = () => {
  const [form, setForm] = useState<CreateUserRequest>({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    dob: "",
  });

  const resetForm = useCallback(() => {
    setForm({
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      dob: "",
    });
  }, []);

  const updateForm = useCallback((field: keyof CreateUserRequest, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const setFormData = useCallback((data: Partial<CreateUserRequest>) => {
    setForm(prev => ({ ...prev, ...data }));
  }, []);

  return {
    form,
    resetForm,
    updateForm,
    setFormData,
  };
};

// Custom hook for modal management
const useModalManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const openAddModal = useCallback(() => setShowAddModal(true), []);
  const closeAddModal = useCallback(() => setShowAddModal(false), []);
  
  const openUpdateModal = useCallback((user: User) => {
    setEditingUser(user);
    setShowUpdateModal(true);
  }, []);
  
  const closeUpdateModal = useCallback(() => {
    setShowUpdateModal(false);
    setEditingUser(null);
  }, []);

  return {
    showAddModal,
    showUpdateModal,
    editingUser,
    openAddModal,
    closeAddModal,
    openUpdateModal,
    closeUpdateModal,
  };
};

// Main component
export default function Home() {
  const { users, loading, addUser, updateUserInList, removeUser } = useUserManagement();
  const { form, resetForm, updateForm, setFormData } = useFormManagement();
  const { 
    showAddModal, 
    showUpdateModal, 
    editingUser, 
    openAddModal, 
    closeAddModal, 
    openUpdateModal, 
    closeUpdateModal 
  } = useModalManagement();

  // Event handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    updateForm(e.target.name as keyof CreateUserRequest, e.target.value);
  }, [updateForm]);

  const handleEdit = useCallback((user: User) => {
    setFormData({
      username: user.username,
      password: "",
      firstName: user.firstName,
      lastName: user.lastName,
      dob: user.dob,
    });
    openUpdateModal(user);
  }, [setFormData, openUpdateModal]);

  const handleSubmitCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addUser(form);
      closeAddModal();
      resetForm();
    } catch (error) {
      // Error already handled in addUser
    }
  }, [form, addUser, closeAddModal, resetForm]);

  const handleSubmitUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const updateData: Partial<UpdateUserRequest> = {
        firstName: form.firstName,
        lastName: form.lastName,
        dob: form.dob,
      };
      if (form.password && form.password.trim() !== "") {
        updateData.password = form.password;
      }
      
      await updateUserInList(editingUser.id, updateData);
      closeUpdateModal();
      resetForm();
    } catch (error) {
      // Error already handled in updateUserInList
    }
  }, [form, editingUser, updateUserInList, closeUpdateModal, resetForm]);

  const handleDelete = useCallback(async (id: string | number) => {
    try {
      await removeUser(id);
    } catch (error) {
      // Error already handled in removeUser
    }
  }, [removeUser]);

  const handleOutsideClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (showAddModal) {
        closeAddModal();
        resetForm();
      }
      if (showUpdateModal) {
        closeUpdateModal();
        resetForm();
      }
    }
  }, [showAddModal, showUpdateModal, closeAddModal, closeUpdateModal, resetForm]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Quản Lý Người Dùng</h1>
      
      {/* Header với nút thêm mới */}
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
        >
          <span>+</span>
          <span>Thêm tài khoản</span>
        </button>
      </div>

      {/* Bảng danh sách người dùng */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 border-b text-left font-semibold">#</th>
                <th className="px-4 py-3 border-b text-left font-semibold">Username</th>
                <th className="px-4 py-3 border-b text-left font-semibold">Họ và tên</th>
                <th className="px-4 py-3 border-b text-left font-semibold">Ngày sinh</th>
                <th className="px-4 py-3 border-b text-left font-semibold">Tình trạng</th>
                <th className="px-4 py-3 border-b text-left font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b">{idx + 1}</td>
                  <td className="px-4 py-3 border-b font-medium">{user.username}</td>
                  <td className="px-4 py-3 border-b">{user.firstName} {user.lastName}</td>
                  <td className="px-4 py-3 border-b">{user.dob}</td>
                  <td className="px-4 py-3 border-b">
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Hoạt động
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-gray-500 text-center">
                    Không có người dùng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal thêm mới người dùng */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={handleOutsideClick}>
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 shadow-xl">
            {/* Header modal */}
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
              <h2 className="text-xl font-semibold">Thêm Mới Người Dùng</h2>
              <button
                onClick={closeAddModal}
                className="text-white hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form content */}
            <form onSubmit={handleSubmitCreate} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cột trái */}
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 font-medium">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Cột phải */}
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 font-medium">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">
                      Ngày sinh <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="dob"
                        value={form.dob}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <svg className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Thêm mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal cập nhật người dùng */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={handleOutsideClick}>
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 shadow-xl">
            {/* Header modal */}
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
              <h2 className="text-xl font-semibold">Cập Nhật Người Dùng</h2>
              <button
                onClick={closeUpdateModal}
                className="text-white hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form content */}
            <form onSubmit={handleSubmitUpdate} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cột trái */}
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 font-medium">
                      Username
                    </label>
                    <input
                      type="text"
                      value={editingUser?.username || ""}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">
                      Mật khẩu (nếu muốn đổi)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Để trống nếu không đổi"
                    />
                  </div>
                </div>

                {/* Cột phải */}
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 font-medium">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">
                      Ngày sinh <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="dob"
                        value={form.dob}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <svg className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={closeUpdateModal}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
