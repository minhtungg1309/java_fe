import { useState, useEffect, useCallback } from 'react';
import { Role } from '../types/role';
import { getRoles } from '../services/roleService';

export const useRoleList = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return { roles, loading };
};
