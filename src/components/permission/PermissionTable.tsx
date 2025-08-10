import React from 'react';
import { Permission } from '../../types/permission';

interface PermissionTableProps {
  permissions: Permission[];
  onDelete: (permissionName: string) => void;
}

export const PermissionTable: React.FC<PermissionTableProps> = ({ permissions, onDelete }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 border-b text-left font-semibold">#</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Tên quyền</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Mô tả</th>
              <th className="px-4 py-3 border-b text-left font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission, idx) => (
              <tr key={permission.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 border-b">{idx + 1}</td>
                <td className="px-4 py-3 border-b font-medium">{permission.name}</td>
                <td className="px-4 py-3 border-b">{permission.description}</td>
                <td className="px-4 py-3 border-b">
                  <button 
                    onClick={() => onDelete(permission.name)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {permissions.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-gray-500 text-center">
                  Không có quyền nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 