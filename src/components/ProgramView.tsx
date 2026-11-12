import React, { useState } from 'react';
import { db } from '../services/storage';
import { ProgramBansos, UserRole } from '../types';
import { formatRupiah } from '../utils/scoring';
import { 
  Layers, 
  Plus, 
  Check, 
  AlertCircle, 
  X, 
  Edit2, 
  ShieldAlert, 
  Building2, 
  Coins, 
  PackageCheck 
} from 'lucide-react';

interface ProgramViewProps {
  userRole: UserRole;
  onNavigateToSchedule?: (progId: string) => void;
}

export const ProgramView: React.FC<ProgramViewProps> = ({ userRole, onNavigateToSchedule }) => {
  const [programs, setPrograms] = useState<ProgramBansos[]>(db.getPrograms());
  const penerimaList = db.getAllPenerima();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ProgramBansos>>({
    kode: 'BLT-DD-2026',
    nama: '',
    sumberDana: 'Dana Desa (APBDes)',
    periode: 'Tahap 1 (Januari - Maret 2026)',
    tahun: 2026,
    jenis: 'Uang Tunai',
    nominalPerKpm: 300000,
    keteranganBarang: '',
    kuota: 50,
    kriteriaEksklusif: true,
    status: 'AKTIF',
    keterangan: ''
  });
  const [formError, setFormError] = useState('');

  const refreshList = () => {
    setPrograms(db.getPrograms());
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedId(null);
    setFormData({
      kode: 'BANSOS-' + Math.floor(100 + Math.random() * 900),
      nama: '',
      sumberDana: 'Dana Desa (APBDes)',
      periode: 'Tahap 1 Tahun 2026',
      tahun: 2026,
      jenis: 'Uang Tunai',
      nominalPerKpm: 300000,
      keteranganBarang: '',
      kuota: 40,
      kriteriaEksklusif: true,
      status: 'AKTIF',
      keterangan: 'Program bantuan desa terpadu.'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ProgramBansos) => {
    setIsEditMode(true);
    setSelectedId(p.id);
    setFormData({ ...p });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.nama?.trim()) {
      setFormError('Nama program bantuan wajib diisi.');
      return;
    }

    if (isEditMode && selectedId) {
      db.updateProgram(selectedId, formData);
    } else {
      db.addProgram(formData as any);
    }

    setIsModalOpen(false);
    refreshList();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500 font-medium">Master Program Bansos · Regulasi & Alokasi</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Pengelolaan Program Bantuan Sosial Desa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar program bantuan dari Dana Desa (APBDes), Kemensos (APBN), maupun Provinsi/Kabupaten.
          </p>
        </div>

        {userRole === 'ADMIN_DESA' && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Program Baru</span>
          </button>
        )}
      </div>

      {/* Program Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map(prog => {
          const allocatedRecipients = penerimaList.filter(p => p.programId === prog.id);
          const deliveredCount = allocatedRecipients.filter(p => p.status === 'SUDAH_DISALURKAN').length;
          const quotaPercent = Math.min(100, (allocatedRecipients.length / prog.kuota) * 100);

          return (
            <div key={prog.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-bold">
                      {prog.kode}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900 mt-1.5">{prog.nama}</h2>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sumber: {prog.sumberDana}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    prog.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {prog.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Bentuk Bantuan:</span>
                    <span className="font-semibold text-slate-900">
                      {prog.jenis === 'Uang Tunai' ? (
                        <span className="flex items-center gap-1 font-mono text-emerald-700">
                          <Coins className="w-3.5 h-3.5" />
                          {formatRupiah(prog.nominalPerKpm)} / KPM
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-800">
                          <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
                          {prog.keteranganBarang || 'Sembako Pangan'}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Periode / Tahap:</span>
                    <span className="font-medium text-slate-800">{prog.periode}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Validasi Bebas Ganda:</span>
                    <span className={`font-semibold ${prog.kriteriaEksklusif ? 'text-blue-700' : 'text-slate-500'}`}>
                      {prog.kriteriaEksklusif ? 'Ya (Anti Double Bantuan)' : 'Boleh Komplementer'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {prog.keterangan || 'Program bantuan sosial untuk penanganan kemiskinan dan ketahanan pangan desa.'}
                </p>
              </div>

              {/* Progress Quota */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between font-mono tabular-nums">
                  <span className="text-slate-500">Alokasi Kuota Penerima:</span>
                  <span className="font-semibold text-slate-900">
                    {allocatedRecipients.length} / {prog.kuota} KPM ({quotaPercent.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${quotaPercent}%` }}
                    className="h-full bg-blue-600 rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Realisasi tersalurkan: <strong className="text-emerald-700">{deliveredCount} KPM</strong></span>
                  {userRole === 'ADMIN_DESA' && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(prog)}
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Edit2 className="w-3 h-3" />
                      Ubah Program
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Tambah/Ubah Program */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {isEditMode ? 'Ubah Data Program Bantuan' : 'Tambah Program Bansos Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Kode Program *</label>
                  <input
                    type="text"
                    value={formData.kode}
                    onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Sumber Anggaran</label>
                  <select
                    value={formData.sumberDana}
                    onChange={(e) => setFormData({ ...formData, sumberDana: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Dana Desa (APBDes)">Dana Desa (APBDes)</option>
                    <option value="Kementerian Sosial RI (APBN)">Kementerian Sosial RI (APBN)</option>
                    <option value="Pemerintah Provinsi">Pemerintah Provinsi</option>
                    <option value="Pemerintah Kabupaten">Pemerintah Kabupaten</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Lengkap Program *</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Bantuan Langsung Tunai Dana Desa (BLT-DD)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Bentuk Bantuan</label>
                  <select
                    value={formData.jenis}
                    onChange={(e) => setFormData({ ...formData, jenis: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Uang Tunai">Uang Tunai</option>
                    <option value="Barang / Sembako">Barang / Sembako</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    {formData.jenis === 'Uang Tunai' ? 'Nominal per KPM (Rp)' : 'Estimasi Nilai (Rp)'}
                  </label>
                  <input
                    type="number"
                    step={50000}
                    value={formData.nominalPerKpm}
                    onChange={(e) => setFormData({ ...formData, nominalPerKpm: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {formData.jenis === 'Barang / Sembako' && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Rincian Paket Barang</label>
                  <input
                    type="text"
                    value={formData.keteranganBarang}
                    onChange={(e) => setFormData({ ...formData, keteranganBarang: e.target.value })}
                    placeholder="Contoh: Beras Premium 10 Kg, Telur 1 Kg, Minyak Goreng 2L"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Periode / Tahap</label>
                  <input
                    type="text"
                    value={formData.periode}
                    onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                    placeholder="Tahap 1 (Januari - Maret 2026)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Kuota Penerima (KPM)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.kuota}
                    onChange={(e) => setFormData({ ...formData, kuota: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.kriteriaEksklusif}
                    onChange={(e) => setFormData({ ...formData, kriteriaEksklusif: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Terapkan Aturan Anti-Bantuan Ganda (Eksklusif)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Master Program</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
