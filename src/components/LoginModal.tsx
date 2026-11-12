import React, { useState } from 'react';
import { db } from '../services/storage';
import { UserRole } from '../types';
import { Lock, User, ShieldCheck, AlertCircle, X, Check } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<UserRole>('ADMIN_DESA');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Masukkan username atau email petugas.');
      return;
    }

    if (!password) {
      setErrorMsg('Masukkan kata sandi.');
      return;
    }

    const res = db.login(username, password, role);
    if (!res.success) {
      setErrorMsg(res.message || 'Kredensial tidak valid.');
      return;
    }

    onSuccess();
    onClose();
  };

  const handleQuickPreset = (presetUsername: string, presetRole: UserRole) => {
    setUsername(presetUsername);
    setPassword('password123');
    setRole(presetRole);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Masuk SIM-BANSOS DESA</h3>
              <p className="text-[11px] text-slate-400">Autentikasi Hak Akses Perangkat Desa</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Quick preset selector for instant testing */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-2">
            <span className="text-[11px] font-semibold text-slate-600 block">
              Pilih Akun Demo Cepat:
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickPreset('admin', 'ADMIN_DESA')}
                className={`px-2 py-1.5 rounded border text-[11px] font-medium transition-all ${
                  role === 'ADMIN_DESA'
                    ? 'bg-blue-50 border-blue-600 text-blue-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Kaur Kesra
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('kades', 'KEPALA_DESA')}
                className={`px-2 py-1.5 rounded border text-[11px] font-medium transition-all ${
                  role === 'KEPALA_DESA'
                    ? 'bg-blue-50 border-blue-600 text-blue-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Kepala Desa
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('rt01', 'PETUGAS_LAPANGAN')}
                className={`px-2 py-1.5 rounded border text-[11px] font-medium transition-all ${
                  role === 'PETUGAS_LAPANGAN'
                    ? 'bg-blue-50 border-blue-600 text-blue-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Ketua RT 001
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username/Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Username atau Email</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: admin atau kades"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Kata Sandi (Password)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
              <p className="text-[10px] text-slate-400">Password default demo: <code className="font-mono">password123</code></p>
            </div>

            {/* Role Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Tingkat Hak Akses (Role)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="ADMIN_DESA">Admin Desa / Kaur Kesra (Kelola Master & Verifikasi)</option>
                <option value="KEPALA_DESA">Kepala Desa (Pimpinan / Approval Akhir Bansos)</option>
                <option value="PETUGAS_LAPANGAN">Petugas Lapangan (Ketua RT / RW / Kadus)</option>
              </select>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Ingat Saya di Perangkat Ini</span>
              </label>
              <span className="text-[11px] text-blue-600">Bantuan Akses</span>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Masuk ke Dashboard Sistem</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
