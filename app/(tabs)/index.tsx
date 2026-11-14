import { ManagerDashboard } from '@/components/home/manager-dashboard';
import { QcHome } from '@/components/home/qc-home';
import { TechnicianHome } from '@/components/home/technician-home';
import { useCurrentUser } from '@/store/useAuthStore';

// Màn hình chính thay đổi theo vai trò của người đăng nhập
export default function HomeScreen() {
  const user = useCurrentUser();
  if (!user) return null;
  if (user.role === 'manager') return <ManagerDashboard />;
  if (user.role === 'qc') return <QcHome />;
  return <TechnicianHome user={user} />;
}
