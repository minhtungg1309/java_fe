import { useState, useEffect, useCallback } from 'react';
import { User, CreateUserRequest, UpdateUserRequest } from '../types/user';
import { createUser, getUsers, deleteUser, updateUser } from '../services/userService';
import toast from 'react-hot-toast';

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
      setError('');
    } catch (err) {
      setError('Không thể lấy danh sách người dùng!');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addUser = useCallback(async (userData: CreateUserRequest) => {
    try {
      setLoading(true);
      const newUser = await createUser(userData);
      setUsers(prevUsers => [...prevUsers, newUser]);
      toast.success('Tạo người dùng thành công!');
      return newUser;
    } catch (err) {
      toast.error('Không thể tạo người dùng!');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserInList = useCallback(async (id: string, userData: Partial<UpdateUserRequest> & { roles?: string[] }) => {
    try {
      setLoading(true);
      
      // Gửi đầy đủ tất cả các field
      const requestData: Partial<UpdateUserRequest> = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        dob: userData.dob,
        roles: userData.roles || [],
        avatar: userData.avatar || '',
        city: userData.city || '',
        email: userData.email || '',
        phone: userData.phone || ''
      };
      
      // Chỉ thêm password nếu có
      if (userData.password && userData.password.trim()) {
        requestData.password = userData.password;
      }
      
      const updatedUser = await updateUser(id, requestData);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === id ? updatedUser : user
        )
      );
      toast.success('Cập nhật người dùng thành công!');
    } catch (err) {
      toast.error('Không thể cập nhật người dùng!');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeUser = useCallback(async (id: string) => {
    try {
      await deleteUser(id);
      setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
      toast.success('Xóa người dùng thành công!');
    } catch (err) {
      toast.error('Không thể xóa người dùng!');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    addUser,
    updateUserInList,
    removeUser,
    fetchUsers,
  };
};
