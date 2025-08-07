import { useState, useEffect, useCallback } from 'react';
import { Permission, CreatePermissionRequest } from '../types/permission';
import { createPermission, getPermissions, deletePermission } from '../services/permissionService';
import toast from 'react-hot-toast';

export const usePermissionManagement = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPermissions();
      setPermissions(data);
      setError('');
    } catch (err) {
      setError('Không thể lấy danh sách quyền!');
      console.error('Error fetching permissions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addPermission = useCallback(async (permissionData: CreatePermissionRequest) => {
    try {
      setLoading(true);
      const newPermission = await createPermission(permissionData);
      setPermissions(prevPermissions => [...prevPermissions, newPermission]);
      toast.success('Tạo quyền thành công!');
      return newPermission;
    } catch (err) {
      toast.error('Không thể tạo quyền!');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removePermission = useCallback(async (permissionName: string) => {
    try {
      await deletePermission(permissionName);
      setPermissions(prevPermissions => 
        prevPermissions.filter(permission => permission.name !== permissionName)
      );
      toast.success('Xóa quyền thành công!');
    } catch (err) {
      toast.error('Không thể xóa quyền!');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    error,
    addPermission,
    removePermission,
    fetchPermissions,
  };
}; 