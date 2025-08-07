import React from 'react';
import { User, UpdateUserRequest } from '../../types/user';
import { Role } from '../../types/role';

interface UpdateUserFormProps {
  form: Partial<UpdateUserRequest> & { roles: string[] };
  roles: Role[];
  editingUser: User;
  loading?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onRoleChange: (roleName: string, checked: boolean) => void;
  onClose: () => void;
}

export const UpdateUserForm: React.FC<UpdateUserFormProps> = ({
  form,
  roles,
  editingUser,
  loading = false,
  onSubmit,
  onChange,
  onRoleChange,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 shadow-xl">
        {/* Header modal */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-xl font-semibold">Cập Nhật Người Dùng</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form content */}
        <form onSubmit={onSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cột trái */}
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Username</label>
                <input
                  type="text"
                  value={editingUser.username}
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
                  value={form.firstName || ''}
                  onChange={onChange}
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
                  value={form.password || ''}
                  onChange={onChange}
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
                  value={form.lastName || ''}
                  onChange={onChange}
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
                    value={form.dob || ''}
                    onChange={onChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <svg className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium">Vai trò</label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-32 overflow-y-auto">
                  {roles.map((role) => (
                    <label key={role.name} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={form.roles?.includes(role.name) || false}
                        onChange={(e) => onRoleChange(role.name, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">
                        <span className="font-medium">{role.name}</span>
                        {role.description && (
                          <span className="text-gray-500 ml-2">- {role.description}</span>
                        )}
                      </span>
                    </label>
                  ))}
                  {roles.length === 0 && (
                    <p className="text-gray-500 text-sm">Chưa có vai trò nào được tạo</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
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
  );
}; 