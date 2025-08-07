import { useState, useEffect, useCallback } from 'react';
import { Permission } from '../types/permission';
import { getPermissions } from '../services/permissionService';

export const usePermissionList = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPermissions();
      setPermissions(data);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return { permissions, loading };
};
