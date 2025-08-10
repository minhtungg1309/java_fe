import { useState, useCallback } from 'react';
import { CreateRoleRequest } from '../types/role';

export const useRoleForm = () => {
  const [form, setForm] = useState<CreateRoleRequest>({
    name: '',
    description: '',
    permissions: [],
  });

  const resetForm = useCallback(() => {
    setForm({
      name: '',
      description: '',
      permissions: [],
    });
  }, []);

  const updateForm = useCallback((field: keyof CreateRoleRequest, value: string | string[]) => {
    setForm((prev: CreateRoleRequest) => ({ ...prev, [field]: value }));
  }, []);

  const updatePermissions = useCallback((permissionName: string, checked: boolean) => {
    setForm((prev: CreateRoleRequest) => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permissionName]
        : prev.permissions.filter((p: string) => p !== permissionName)
    }));
  }, []);

  return {
    form,
    resetForm,
    updateForm,
    updatePermissions,
  };
};
