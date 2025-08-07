import { useState, useEffect, useCallback } from 'react';
import { Role, CreateRoleRequest } from '../types/role';
import { createRole, getRoles, deleteRole } from '../services/roleService';
import toast from 'react-hot-toast';

export const useRoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRoles();
      setRoles(data);
      setError('');
    } catch (err) {
      setError('Không thể lấy danh sách vai trò!');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addRole = useCallback(async (roleData: CreateRoleRequest) => {
    try {
      setLoading(true);
      const newRole = await createRole(roleData);
      setRoles(prevRoles => [...prevRoles, newRole]);
      toast.success('Tạo vai trò thành công!');
      return newRole;
    } catch (err) {
      toast.error('Không thể tạo vai trò!');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeRole = useCallback(async (roleName: string) => {
    try {
      await deleteRole(roleName);
      setRoles(prevRoles => 
        prevRoles.filter(role => role.name !== roleName)
      );
      toast.success('Xóa vai trò thành công!');
    } catch (err) {
      toast.error('Không thể xóa vai trò!');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    loading,
    error,
    addRole,
    removeRole,
    fetchRoles,
  };
};
