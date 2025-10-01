import { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";
import { getMyInfo } from "../services/userService";
import { User } from "../types/user";

export default function UserProfiles() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await getMyInfo();
        setUser(me);
      } catch (e) {
        console.error("Không thể tải thông tin người dùng", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <PageMeta title="Hồ sơ cá nhân" description="Trang hồ sơ người dùng" />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          {loading ? "Đang tải..." : "Profile"}
        </h3>
        {!loading && user && (
          <div className="space-y-6">
            <UserMetaCard user={user} />
            <UserInfoCard user={user} />
            <UserAddressCard user={user} />
          </div>
        )}
        {!loading && !user && (
          <div className="text-gray-500">Không có dữ liệu người dùng.</div>
        )}
      </div>
    </>
  );
}
