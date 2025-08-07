import React, { useCallback } from 'react';
import { RoleTable } from '../../components/role/RoleTable';
import { CreateRoleModal } from '../../components/role/CreateRoleModal';
import { useRoleManagement } from '../../hooks/useRoleManagement';
import { useRoleForm } from '../../hooks/useRoleForm';
import { usePermissionList } from '../../hooks/usePermissionList';
import { useModal } from '../../hooks/useModal';
import { CreateRoleRequest } from '../../types/role';

/**
 * Component quản lý vai trò
 */
export default function Role() {
  const { roles, loading, addRole, removeRole } = useRoleManagement();
  const { permissions } = usePermissionList();
  const { form, resetForm, updateForm, updatePermissions } = useRoleForm();
  const { isOpen: showAddModal, openModal: openAddModal, closeModal: closeAddModal } = useModal();

  // Event handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateForm(e.target.name as keyof CreateRoleRequest, e.target.value);
  }, [updateForm]);

  const handlePermissionChange = useCallback((permissionName: string, checked: boolean) => {
    updatePermissions(permissionName, checked);
  }, [updatePermissions]);

  const handleSubmitCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addRole(form);
      closeAddModal();
      resetForm();
    } catch {
      // Error already handled in addRole
    }
  }, [form, addRole, closeAddModal, resetForm]);

  const handleDelete = useCallback(async (roleName: string) => {
    try {
      await removeRole(roleName);
    } catch {
      // Error already handled in removeRole
    }
  }, [removeRole]);

  const handleCloseModal = useCallback(() => {
    closeAddModal();
    resetForm();
  }, [closeAddModal, resetForm]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Quản Lý Vai Trò</h1>
      
      {/* Header với nút thêm mới */}
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
        >
          <span>+</span>
          <span>Thêm vai trò</span>
        </button>
      </div>

      {/* Bảng danh sách vai trò */}
      <RoleTable 
        roles={roles}
        onDelete={handleDelete}
      />

      {/* Modal thêm mới vai trò */}
      {showAddModal && (
        <CreateRoleModal
          form={form}
          permissions={permissions}
          loading={loading}
          onSubmit={handleSubmitCreate}
          onChange={handleChange}
          onPermissionChange={handlePermissionChange}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
} 