import { useState } from "react";
import { createUser, User, CreateUserRequest } from "../../services/userService.ts";

const initialUsers: User[] = [
  { id: 1, username: "tung14", firstName: "Nguyễn", lastName: "Văn A", dob: "2000-01-01" },
  { id: 2, username: "buser", firstName: "Trần", lastName: "Thị B", dob: "1999-05-10" },
];

export default function Home() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [form, setForm] = useState<CreateUserRequest>({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    dob: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = (id: string | number) => {
    setUsers(users.filter((user) => user.id !== id));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const newUser = await createUser(form);
      setUsers([...users, newUser]);
      setForm({ username: "", password: "", firstName: "", lastName: "", dob: "" });
    } catch (err: any) {
      setError("Tạo user thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Quản lý người dùng</h1>
      <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block mb-1 font-medium">Username</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-40"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-40"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">First Name</label>
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-40"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-40"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Ngày sinh</label>
          <input
            type="date"
            name="dob"
            value={form.dob}
            onChange={handleChange}
            className="border px-3 py-2 rounded w-40"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold"
          disabled={loading}
        >
          {loading ? "Đang tạo..." : "Tạo mới"}
        </button>
        {error && <span className="text-red-500 ml-4">{error}</span>}
      </form>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">STT</th>
              <th className="px-4 py-2 border-b">Username</th>
              <th className="px-4 py-2 border-b">First Name</th>
              <th className="px-4 py-2 border-b">Last Name</th>
              <th className="px-4 py-2 border-b">Ngày sinh</th>
              <th className="px-4 py-2 border-b">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id} className="text-center">
                <td className="px-4 py-2 border-b">{idx + 1}</td>
                <td className="px-4 py-2 border-b">{user.username}</td>
                <td className="px-4 py-2 border-b">{user.firstName}</td>
                <td className="px-4 py-2 border-b">{user.lastName}</td>
                <td className="px-4 py-2 border-b">{user.dob}</td>
                <td className="px-4 py-2 border-b">
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-gray-500">Không có người dùng nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
