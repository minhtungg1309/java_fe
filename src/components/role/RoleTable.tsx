import React from 'react';
import { Role } from '../../types/role';

interface RoleTableProps {
  roles: Role[];
  onDelete: (roleName: string) => void;
}

export const RoleTable: React.FC<RoleTableProps> = ({ roles, onDelete }) => {
  const renderPermissions = (permissions: Role['permissions']) => {
    if (!permissions || permissions.length === 0) {
      return <span className="text-gray-400 text-xs">Không có quyền</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {permissions.map((permission, idx) => (
          <span
            key={idx}
            className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
          >
            {permission.name}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="border-b border-gray-100 dark:border-white/[0.05]">
            <tr className="bg-gray-50">
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">#</th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">Tên vai trò</th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">Mô tả</th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">Quyền</th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {roles.map((role, idx) => (
              <tr key={role.name} className="hover:bg-gray-50">
                <td className="px-5 py-4 text-start">{idx + 1}</td>
                <td className="px-5 py-4 font-medium text-gray-800 text-sm dark:text-white/90">{role.name}</td>
                <td className="px-5 py-4 text-gray-500 text-sm dark:text-gray-400">{role.description}</td>
                <td className="px-5 py-4">{renderPermissions(role.permissions)}</td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => onDelete(role.name)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-gray-400 text-center text-sm">
                  Không có vai trò nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};