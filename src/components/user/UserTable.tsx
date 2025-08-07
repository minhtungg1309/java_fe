import React from 'react';
import { User } from '../../types/user';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete }) => {
  const renderRoles = (roles: User['roles']) => {
    if (!roles || roles.length === 0) {
      return <span className="text-gray-500 text-sm">Chưa phân quyền</span>;
    }

    return (
      <div className="space-y-1">
        {roles.map((role, index) => (
          <div key={index} className="flex flex-col">
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              {role.name}
            </span>
            {role.description && (
              <span className="text-xs text-gray-500 mt-1">
                {role.description}
              </span>
            )}
            {role.permissions && role.permissions.length > 0 && (
              <div className="mt-1">
                <span className="text-xs text-gray-600 font-medium">Quyền:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {role.permissions.map((permission, permIndex) => (
                    <span 
                      key={permIndex}
                      className="inline-flex items-center bg-gray-100 text-gray-700 px-1 py-0.5 rounded text-xs"
                    >
                      {permission.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderFullName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return "Chưa cập nhật";
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 border-b text-left font-semibold">#</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Username</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Họ và tên</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Ngày sinh</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Vai trò</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Tình trạng</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 border-b">{idx + 1}</td>
                <td className="px-4 py-3 border-b font-medium">{user.username}</td>
                <td className="px-4 py-3 border-b">{renderFullName(user)}</td>
                <td className="px-4 py-3 border-b">{user.dob || "N/A"}</td>
                <td className="px-4 py-3 border-b">{renderRoles(user.roles)}</td>
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
                      onClick={() => onEdit(user)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Sửa
                    </button>
                    <button 
                      onClick={() => onDelete(user.id)}
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
                <td colSpan={7} className="py-4 text-gray-500 text-center">
                  Không có người dùng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 