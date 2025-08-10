import { useState, useCallback } from 'react';
import { CreatePermissionRequest } from '../types/permission';

export const usePermissionForm = () => {
  const [form, setForm] = useState<CreatePermissionRequest>({
    name: '',
    description: '',
  });

  const resetForm = useCallback(() => {
    setForm({
      name: '',
      description: '',
    });
  }, []);

  const updateForm = useCallback((field: keyof CreatePermissionRequest, value: string) => {
    setForm((prev: CreatePermissionRequest) => ({ ...prev, [field]: value }));
  }, []);

  return {
    form,
    resetForm,
    updateForm,
  };
}; 