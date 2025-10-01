import React from 'react';
import { User } from '../../types/user';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}

/**
 * Bảng hiển thị danh sách người dùng với các trường thông tin mới
 */
export const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete }) => {
  const renderRoles = (roles: User['roles']) => {
    if (!roles || roles.length === 0) {
      return <span className="text-gray-500 text-theme-xs">Chưa phân quyền</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {roles.map((r, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
            title={r.description || r.name}
          >
            {r.name}
          </span>
        ))}
      </div>
    );
  };

  const renderFullName = (u: User) =>
    (u.firstName || u.lastName) ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : 'Chưa cập nhật';

  const renderAvatar = (avatar: string | null, alt: string) => (
    <div className="w-10 h-10 overflow-hidden rounded-full border border-gray-200">
      {avatar ? (
        <img src={avatar} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  );

  const renderContact = (u: User) => (
    <div className="space-y-1 text-gray-600 text-theme-xs">
      {u.email && (
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>{u.email}</span>
        </div>
      )}
      {u.phone && (
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>{u.phone}</span>
        </div>
      )}
      {u.city && (
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{u.city}</span>
        </div>
      )}
      {!u.email && !u.phone && !u.city && <span className="text-gray-400">Chưa cập nhật</span>}
    </div>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 border-b text-left font-semibold">#</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Avatar</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Username</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Họ và tên</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Ngày sinh</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Thông tin liên hệ</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Vai trò</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Tình trạng</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 border-b">{idx + 1}</td>
                <td className="px-4 py-3 border-b">
                  {renderAvatar(user.avatar, 'Avatar của ' + renderFullName(user))}
                </td>
                <td className="px-4 py-3 border-b font-medium">{user.username}</td>
                <td className="px-4 py-3 border-b">{renderFullName(user)}</td>
                <td className="px-4 py-3 border-b">{user.dob || "N/A"}</td>
                <td className="px-4 py-3 border-b">
                  {renderContact(user)}
                </td>
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
                <td colSpan={9} className="py-4 text-gray-500 text-center">
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