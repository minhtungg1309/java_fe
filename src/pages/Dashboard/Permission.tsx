import React, { useCallback } from "react";
import { PermissionTable } from "../../components/permission/PermissionTable";
import { CreatePermissionModal } from "../../components/permission/CreatePermissionModal";
import { usePermissionManagement } from "../../hooks/usePermissionManagement";
import { usePermissionForm } from "../../hooks/usePermissionForm";
import { useModal } from "../../hooks/useModal";
import { CreatePermissionRequest } from "../../types/permission";
import ComponentCard from "../../components/common/ComponentCard";

/**
 * Component quản lý quyền
 */
export default function Permission() {
  const { permissions, loading, addPermission, removePermission } =
    usePermissionManagement();
  const { form, resetForm, updateForm } = usePermissionForm();
  const {
    isOpen: showAddModal,
    openModal: openAddModal,
    closeModal: closeAddModal,
  } = useModal();

  // Event handlers
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateForm(
        e.target.name as keyof CreatePermissionRequest,
        e.target.value
      );
    },
    [updateForm]
  );

  const handleSubmitCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await addPermission(form);
        closeAddModal();
        resetForm();
      } catch {
        // Error already handled in addPermission
      }
    },
    [form, addPermission, closeAddModal, resetForm]
  );

  const handleDelete = useCallback(
    async (permissionName: string) => {
      try {
        await removePermission(permissionName);
      } catch {
        // Error already handled in removePermission
      }
    },
    [removePermission]
  );

  const handleCloseModal = useCallback(() => {
    closeAddModal();
    resetForm();
  }, [closeAddModal, resetForm]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-6">Quản Lý Quyền</h1>

      {/* Header với nút thêm mới */}
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
        >
          <span>+</span>
          <span>Thêm quyền</span>
        </button>
      </div>

      <ComponentCard title="Permission">
        {/* Bảng danh sách quyền */}
        <PermissionTable permissions={permissions} onDelete={handleDelete} />
      </ComponentCard>

      {/* Modal thêm mới quyền */}
      {showAddModal && (
        <CreatePermissionModal
          form={form}
          loading={loading}
          onSubmit={handleSubmitCreate}
          onChange={handleChange}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
