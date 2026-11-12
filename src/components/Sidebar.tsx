import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  Layers, 
  Truck, 
  FileText, 
  ShieldAlert, 
  UserCog,
  ChevronRight
} from 'lucide-react';
import { UserRole } from '../types';

export type NavTab = 
  | 'dashboard' 
  | 'warga' 
  | 'usulan' 
  | 'program' 
  | 'penyaluran' 
  | 'laporan' 
  | 'audit' 
  | 'users';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: UserRole;
  pendingVerifikasiCount: number;
  pendingApprovalCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  pendingVerifikasiCount,
  pendingApprovalCount
}) => {
  const menuItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard Monitoring',
      icon: LayoutDashboard,
      roles: ['ADMIN_DESA', 'KEPALA_DESA', 'PETUGAS_LAPANGAN']
    },
    {
      id: 'warga' as NavTab,
      label: 'Master Data Penduduk',
      icon: Users,
      roles: ['ADMIN_DESA', 'KEPALA_DESA', 'PETUGAS_LAPANGAN']
    },
    {
      id: 'usulan' as NavTab,
      label: 'Usulan & Verifikasi',
      icon: ClipboardCheck,
      badge: userRole === 'ADMIN_DESA' 
        ? pendingVerifikasiCount 
        : userRole === 'KEPALA_DESA' 
          ? pendingApprovalCount 
          : undefined,
      roles: ['ADMIN_DESA', 'KEPALA_DESA', 'PETUGAS_LAPANGAN']
    },
    {
      id: 'program' as NavTab,
      label: 'Program Bantuan',
      icon: Layers,
      roles: ['ADMIN_DESA', 'KEPALA_DESA']
    },
    {
      id: 'penyaluran' as NavTab,
      label: 'Distribusi & Penyaluran',
      icon: Truck,
      roles: ['ADMIN_DESA', 'KEPALA_DESA', 'PETUGAS_LAPANGAN']
    },
    {
      id: 'laporan' as NavTab,
      label: 'Laporan & Berita Acara',
      icon: FileText,
      roles: ['ADMIN_DESA', 'KEPALA_DESA', 'PETUGAS_LAPANGAN']
    },
    {
      id: 'audit' as NavTab,
      label: 'Log Audit (Audit Trail)',
      icon: ShieldAlert,
      roles: ['ADMIN_DESA', 'KEPALA_DESA']
    },
    {
      id: 'users' as NavTab,
      label: 'Pengaturan Petugas',
      icon: UserCog,
      roles: ['ADMIN_DESA']
    }
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] no-print">
      <div className="p-4 border-b border-slate-800">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Menu Navigasi
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {filteredItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Role Indicator Footer */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Akses Sistem:</div>
        <div className="font-semibold text-slate-200">
          {userRole === 'ADMIN_DESA' && 'Kaur Kesra (Akses Penuh)'}
          {userRole === 'KEPALA_DESA' && 'Kepala Desa (Approval Akhir)'}
          {userRole === 'PETUGAS_LAPANGAN' && 'Petugas RT/RW (Usulan & Serah Terima)'}
        </div>
      </div>
    </aside>
  );
};
