import React, { useState, useEffect } from 'react';
import { db } from './services/storage';
import { User, UserRole } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { LandingPublicCheck } from './components/LandingPublicCheck';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './components/DashboardView';
import { WargaView } from './components/WargaView';
import { UsulanView } from './components/UsulanView';
import { ProgramView } from './components/ProgramView';
import { PenyaluranView } from './components/PenyaluranView';
import { LaporanView } from './components/LaporanView';
import { AuditLogView } from './components/AuditLogView';
import { UserManagementView } from './components/UserManagementView';
import { DatabaseGuideModal } from './components/DatabaseGuideModal';
import { LogOut, X, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(db.getActiveUser());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isPublicCheckOpen, setIsPublicCheckOpen] = useState(false);

  // Subscribe to DB changes for real-time reactivity
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = db.subscribe(() => {
      setCurrentUser(db.getActiveUser());
      setTick(t => t + 1);
    });
    return unsub;
  }, []);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    db.logout();
    setCurrentUser(null);
    setIsLogoutModalOpen(false);
    setCurrentTab('dashboard');
  };

  const handleQuickRoleSwitch = (role: UserRole) => {
    const allUsers = db.getUsers();
    const targetUser = allUsers.find(u => u.role === role);
    if (targetUser) {
      db.login(targetUser.username, 'password123', role);
    }
  };

  const handleResetData = () => {
    if (confirm('Kembalikan semua data warga, usulan, program, dan penyaluran ke data awal seeder?')) {
      db.resetToSeedData();
    }
  };

  // Pending counts
  const usulanList = db.getUsulan();
  const pendingVerifikasiCount = usulanList.filter(u => u.status === 'MENUNGGU_VERIFIKASI_ADMIN').length;
  const pendingApprovalCount = usulanList.filter(u => u.status === 'MENUNGGU_PERSETUJUAN_KADES').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onOpenPublicCheck={() => {
          if (currentUser) {
            setIsPublicCheckOpen(true);
          } else {
            setIsPublicCheckOpen(false);
          }
        }}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Main View Area */}
      {!currentUser ? (
        // TAHAP 1: Landing Page & Public NIK Check
        <main className="flex-1 py-4 sm:py-8">
          <LandingPublicCheck
            onLoginClick={() => setIsLoginModalOpen(true)}
            onOpenGuide={() => setIsGuideModalOpen(true)}
          />
        </main>
      ) : (
        // Authenticated Workspace (Tahap 2 - 8)
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar
            currentTab={currentTab}
            onSelectTab={(tab) => setCurrentTab(tab)}
            userRole={currentUser.role}
            pendingVerifikasiCount={pendingVerifikasiCount}
            pendingApprovalCount={pendingApprovalCount}
          />

          {/* Center Main Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {/* Quick Role Switcher Bar for Demo Evaluators */}
            <div className="no-print mb-6 bg-slate-900/90 text-white p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Role Aktif Saat Ini:</span>
                <span className="font-bold text-white uppercase tracking-wide">
                  {currentUser.role === 'ADMIN_DESA' && 'Admin Desa / Kaur Kesra (Budi Hartono)'}
                  {currentUser.role === 'KEPALA_DESA' && 'Kepala Desa (H. Ahmad Suryanto)'}
                  {currentUser.role === 'PETUGAS_LAPANGAN' && 'Petugas RT/RW (Siti Rahayu)'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] hidden sm:inline">Ganti Peran Uji Coba:</span>
                <button
                  type="button"
                  onClick={() => handleQuickRoleSwitch('ADMIN_DESA')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    currentUser.role === 'ADMIN_DESA'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Kaur Kesra
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRoleSwitch('KEPALA_DESA')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    currentUser.role === 'KEPALA_DESA'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Kepala Desa
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRoleSwitch('PETUGAS_LAPANGAN')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    currentUser.role === 'PETUGAS_LAPANGAN'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Ketua RT
                </button>
              </div>
            </div>

            {/* View Component Rendering */}
            {currentTab === 'dashboard' && (
              <DashboardView
                userRole={currentUser.role}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'warga' && (
              <WargaView
                userRole={currentUser.role}
                onProposeBansos={() => setCurrentTab('usulan')}
              />
            )}

            {currentTab === 'usulan' && (
              <UsulanView userRole={currentUser.role} />
            )}

            {currentTab === 'program' && (
              <ProgramView
                userRole={currentUser.role}
                onNavigateToSchedule={() => setCurrentTab('penyaluran')}
              />
            )}

            {currentTab === 'penyaluran' && (
              <PenyaluranView userRole={currentUser.role} />
            )}

            {currentTab === 'laporan' && (
              <LaporanView userRole={currentUser.role} />
            )}

            {currentTab === 'audit' && (
              <AuditLogView />
            )}

            {currentTab === 'users' && (
              <UserManagementView
                currentUser={currentUser}
                onResetData={handleResetData}
              />
            )}
          </main>
        </div>
      )}

      {/* MODAL: Login */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setCurrentUser(db.getActiveUser());
          setCurrentTab('dashboard');
        }}
      />

      {/* MODAL: Database Guide & Local Setup */}
      <DatabaseGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* MODAL: Cek NIK saat sedang login */}
      {isPublicCheckOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full my-8 p-6 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Pencarian Status Bantuan NIK Warga</h3>
              <button
                type="button"
                onClick={() => setIsPublicCheckOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <LandingPublicCheck
              onLoginClick={() => setIsPublicCheckOpen(false)}
              onOpenGuide={() => {
                setIsPublicCheckOpen(false);
                setIsGuideModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Logout (Tahap 8) */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                Konfirmasi Keluar Sistem
              </h3>
              <p className="text-xs text-slate-600">
                Apakah Anda yakin ingin keluar dari sistem SIM-BANSOS DESA? Sesi akun Anda akan diakhiri.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
