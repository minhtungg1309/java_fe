import React from 'react';
import { CreateRoleRequest } from '../../types/role';
import { Permission } from '../../types/permission';

interface CreateRoleModalProps {
  form: CreateRoleRequest;
  permissions: Permission[];
  loading?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onPermissionChange: (permissionName: string, checked: boolean) => void;
  onClose: () => void;
}

export const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  form,
  permissions,
  loading = false,
  onSubmit,
  onChange,
  onPermissionChange,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 shadow-xl">
        {/* Header modal */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-xl font-semibold">Thêm Mới Vai Trò</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form content */}
        <form onSubmit={onSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">
                Tên vai trò <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VD: ADMIN, USER, MODERATOR"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mô tả chi tiết về vai trò này"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Quyền <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                {permissions.map((permission) => (
                  <label key={permission.name} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(permission.name)}
                      onChange={(e) => onPermissionChange(permission.name, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">
                      <span className="font-medium">{permission.name}</span>
                      {permission.description && (
                        <span className="text-gray-500 ml-2">- {permission.description}</span>
                      )}
                    </span>
                  </label>
                ))}
                {permissions.length === 0 && (
                  <p className="text-gray-500 text-sm">Chưa có quyền nào được tạo</p>
                )}
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
              Thêm mới
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 