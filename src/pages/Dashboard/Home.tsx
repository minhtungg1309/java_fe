import React, { useCallback } from 'react';
import { UserTable } from '../../components/user/UserTable';
import { CreateUserForm } from '../../components/user/CreateUserForm';
import { UpdateUserForm } from '../../components/user/UpdateUserForm';
import { useUserManagement } from '../../hooks/useUserManagement';
import { useUserForm } from '../../hooks/useUserForm';
import { useRoleList } from '../../hooks/useRoleList';
import { useModal } from '../../hooks/useModal';
import ComponentCard from "../../components/common/ComponentCard";
import { User, CreateUserRequest, UpdateUserRequest } from '../../types/user';

/**
 * Component quản lý người dùng
 */
export default function Home() {
  const { users, loading, addUser, updateUserInList, removeUser } = useUserManagement();
  const { roles } = useRoleList();
  const { form, resetForm, updateForm, populateFormForEdit } = useUserForm();
  const { isOpen: showAddModal, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: showUpdateModal, openModal: openUpdateModal, closeModal: closeUpdateModal } = useModal();
  const [editingUser, setEditingUser] = React.useState<User | null>(null);

  // Event handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    updateForm(e.target.name as keyof (CreateUserRequest & { roles: string[] }), e.target.value);
  }, [updateForm]);

  const handleRoleChange = useCallback((roleName: string, checked: boolean) => {
    updateForm('roles', checked 
      ? [...form.roles, roleName]
      : form.roles.filter((r: string) => r !== roleName)
    );
  }, [updateForm, form.roles]);

  const handleEdit = useCallback((user: User) => {
    populateFormForEdit(user);
    setEditingUser(user);
    openUpdateModal();
  }, [populateFormForEdit, openUpdateModal]);

  const handleSubmitCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addUser(form);
      closeAddModal();
      resetForm();
    } catch {
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
        roles: form.roles,
        avatar: form.avatar,
        city: form.city,
        email: form.email,
        phone: form.phone,
      };
      
      if (form.password && form.password.trim() !== '') {
        updateData.password = form.password;
      }
      
      await updateUserInList(editingUser.id, updateData);
      closeUpdateModal();
      resetForm();
      setEditingUser(null);
    } catch {
      // Error already handled in updateUserInList
    }
  }, [form, editingUser, updateUserInList, closeUpdateModal, resetForm]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await removeUser(id);
    } catch {
      // Error already handled in removeUser
    }
  }, [removeUser]);

  const handleCloseModal = useCallback(() => {
    if (showAddModal) {
      closeAddModal();
      resetForm();
    }
    if (showUpdateModal) {
      closeUpdateModal();
      resetForm();
      setEditingUser(null);
    }
  }, [showAddModal, showUpdateModal, closeAddModal, closeUpdateModal, resetForm]);

  return (
    <div className="space-y-6">
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

     
       <ComponentCard title="User">
           {/* Bảng danh sách người dùng */}
      <UserTable 
        users={users}
        onEdit={handleEdit} 
        onDelete={handleDelete}
      />
        </ComponentCard>

      {/* Modal thêm mới người dùng */}
      {showAddModal && (
        <CreateUserForm
          form={form} 
          loading={loading}
          onSubmit={handleSubmitCreate}
          onChange={handleChange}
          onClose={handleCloseModal}
        />
      )}

      {/* Modal cập nhật người dùng */}
      {showUpdateModal && editingUser && (
        <UpdateUserForm
          form={form}
          roles={roles}
          editingUser={editingUser}
          loading={loading}
          onSubmit={handleSubmitUpdate}
          onChange={handleChange}
          onRoleChange={handleRoleChange}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
