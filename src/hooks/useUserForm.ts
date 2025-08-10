import { useState, useCallback } from 'react';
import { CreateUserRequest, User } from '../types/user';

interface UserFormData extends CreateUserRequest {
  roles: string[];
}

export const useUserForm = () => {
  const [form, setForm] = useState<UserFormData>({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    dob: '',
    roles: [],
  });

  const resetForm = useCallback(() => {
    setForm({
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      dob: '',
      roles: [],
    });
  }, []);

  const updateForm = useCallback((field: keyof UserFormData, value: string | string[]) => {
    setForm((prev: UserFormData) => ({ ...prev, [field]: value }));
  }, []);

  const setFormData = useCallback((data: Partial<UserFormData>) => {
    setForm((prev: UserFormData) => ({ ...prev, ...data }));
  }, []);

  const populateFormForEdit = useCallback((user: User) => {
    setForm({
      username: user.username,
      password: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      dob: user.dob || '',
      roles: user.roles?.map((role: { name: string }) => role.name) || [],
    });
  }, []);

  return {
    form,
    resetForm,
    updateForm,
    setFormData,
    populateFormForEdit,
  };
};
