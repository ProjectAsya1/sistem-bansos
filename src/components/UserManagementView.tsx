import React, { useState } from 'react';
import { db } from '../services/storage';
import { User, UserRole } from '../types';
import { UserCog, Plus, Trash2, Key, Check, AlertCircle, X, Shield, RefreshCcw } from 'lucide-react';

interface UserManagementViewProps {
  currentUser: User;
  onResetData: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser, onResetData }) => {
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [username, setUsername] = useState('');
  const [nama, setNama] = useState('');
  const [role, setRole] = useState<UserRole>('PETUGAS_LAPANGAN');
  const [jabatan, setJabatan] = useState('Ketua RT 002 Dusun Sukamaju');
  const [wilayah, setWilayah] = useState('Dusun Sukamaju');
  const [email, setEmail] = useState('');
  const [telepon, setTelepon] = useState('0812-');
  const [formError, setFormError] = useState('');

  const refreshList = () => {
    setUsers(db.getUsers());
  };

  const handleOpenAdd = () => {
    setUsername('');
    setNama('');
    setRole('PETUGAS_LAPANGAN');
    setJabatan('Ketua RT');
    setWilayah('Dusun Krajan');
    setEmail('');
    setTelepon('08');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!username.trim() || !nama.trim() || !email.trim()) {
      setFormError('Lengkapi semua data akun petugas.');
      return;
    }

    const res = db.addUser({
      username: username.trim().toLowerCase(),
      nama,
      role,
      jabatan,
      wilayahTugas: wilayah,
      email,
      telepon
    });

    if (!res.success) {
      setFormError(res.message || 'Gagal menambahkan akun.');
      return;
    }

    setIsAddModalOpen(false);
    refreshList();
  };

  const handleDeleteUser = (u: User) => {
    if (confirm(`Hapus akun petugas "${u.nama}"?`)) {
      const res = db.deleteUser(u.id);
      if (!res.success) {
        alert(res.message);
      } else {
        refreshList();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500 font-medium">Manajemen Hak Akses & Perangkat</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-blue-600" />
            Manajemen Akun Petugas Desa & Pengaturan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola hak akses operator desa, kepala dusun, dan ketua RT/RW di wilayah desa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetData}
            title="Kembalikan data ke kondisi awal seeder"
            className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCcw className="w-4 h-4 text-rose-600" />
            <span>Reset Data Demo Seeder</span>
          </button>

          {currentUser.role === 'ADMIN_DESA' && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Akun Petugas</span>
            </button>
          )}
        </div>
      </div>

      {/* Current User Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
            {currentUser.nama.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">{currentUser.nama}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                {currentUser.role}
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-0.5">{currentUser.jabatan}</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {currentUser.email} · {currentUser.telepon}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 w-full sm:w-auto">
          <span className="font-semibold text-slate-700 block">Status Sesi:</span>
          <span>Sedang aktif terotentikasi</span>
        </div>
      </div>

      {/* Officers List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">Daftar Akun Petugas & Hak Akses</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Nama Petugas</th>
                <th className="py-3 px-4">Username & Email</th>
                <th className="py-3 px-4">Role Hak Akses</th>
                <th className="py-3 px-4">Jabatan & Wilayah Tugas</th>
                <th className="py-3 px-4">No. HP</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {u.nama}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    <div>{u.username}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'ADMIN_DESA' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'KEPALA_DESA' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div>{u.jabatan}</div>
                    <div className="text-[11px] text-slate-500">{u.wilayahTugas || 'Kantor Balai Desa'}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    {u.telepon}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {currentUser.role === 'ADMIN_DESA' && u.id !== currentUser.id ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        title="Hapus Akun Petugas"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah Petugas */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                Tambah Akun Petugas Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Username *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: rt02"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Lengkap Petugas *</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Bambang Irawan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tingkat Hak Akses (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="PETUGAS_LAPANGAN">Petugas Lapangan (Ketua RT / RW / Kadus)</option>
                  <option value="ADMIN_DESA">Admin Desa / Kaur Kesra</option>
                  <option value="KEPALA_DESA">Kepala Desa (Pimpinan)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Jabatan</label>
                  <input
                    type="text"
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    placeholder="Ketua RT 002"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Wilayah Tugas</label>
                  <input
                    type="text"
                    value={wilayah}
                    onChange={(e) => setWilayah(e.target.value)}
                    placeholder="Dusun Sukamaju"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Email Resmi *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rt02@sukamaju.desa.id"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nomor HP / WhatsApp</label>
                <input
                  type="text"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Password default untuk akun baru adalah: <code className="font-mono">password123</code>
              </p>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Daftarkan Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
