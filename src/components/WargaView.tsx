import React, { useState, useRef } from 'react';
import { db } from '../services/storage';
import { Warga, UserRole, StatusRumah, KondisiLantai, KondisiDinding, KondisiAtap, DayaListrik } from '../types';
import { formatRupiah, maskNik } from '../utils/scoring';
import { 
  Users, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Trash2, 
  Edit3, 
  Eye, 
  X, 
  AlertCircle, 
  Check, 
  UploadCloud,
  FileCheck
} from 'lucide-react';

interface WargaViewProps {
  userRole: UserRole;
  onProposeBansos?: (warga: Warga) => void;
}

export const WargaView: React.FC<WargaViewProps> = ({ userRole, onProposeBansos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDusun, setFilterDusun] = useState('ALL');
  const [wargaList, setWargaList] = useState<Warga[]>(db.getWarga());

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Warga>>({
    nik: '',
    noKk: '',
    nama: '',
    tempatLahir: '',
    tanggalLahir: '1985-01-01',
    jenisKelamin: 'L',
    alamat: '',
    dusun: 'Dusun Krajan',
    rt: '001',
    rw: '001',
    pekerjaan: 'Buruh Tani',
    penghasilan: 750000,
    jumlahTanggungan: 2,
    statusRumah: 'Milik Sendiri',
    kondisiLantai: 'Semen Kasar',
    kondisiDinding: 'Bambu / Gedek',
    kondisiAtap: 'Genteng Tanah',
    dayaListrik: 'Non-PLN / 450 VA',
    lansiaDisabilitas: false
  });
  const [formError, setFormError] = useState('');

  // Import State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importResults, setImportResults] = useState<{ success: boolean; importedCount: number; errors: string[] } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const refreshList = () => {
    setWargaList(db.getWarga());
  };

  // Filtered List
  const filtered = wargaList.filter(w => {
    const matchesSearch = 
      w.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
      w.nik.includes(searchTerm) || 
      w.noKk.includes(searchTerm);
    const matchesDusun = filterDusun === 'ALL' || w.dusun === filterDusun;
    return matchesSearch && matchesDusun;
  });

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedWarga(null);
    setFormData({
      nik: '',
      noKk: '',
      nama: '',
      tempatLahir: 'Malang',
      tanggalLahir: '1985-01-01',
      jenisKelamin: 'L',
      alamat: '',
      dusun: 'Dusun Krajan',
      rt: '001',
      rw: '001',
      pekerjaan: 'Buruh Tani',
      penghasilan: 650000,
      jumlahTanggungan: 2,
      statusRumah: 'Milik Sendiri',
      kondisiLantai: 'Semen Kasar',
      kondisiDinding: 'Bambu / Gedek',
      kondisiAtap: 'Genteng Tanah',
      dayaListrik: 'Non-PLN / 450 VA',
      lansiaDisabilitas: false
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (w: Warga) => {
    setIsEditMode(true);
    setSelectedWarga(w);
    setFormData({ ...w });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenDetail = (w: Warga) => {
    setSelectedWarga(w);
    setIsDetailModalOpen(true);
  };

  const handleDelete = (w: Warga) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data penduduk atas nama "${w.nama}" (NIK: ${w.nik})?`)) {
      const res = db.deleteWarga(w.id);
      if (!res.success) {
        alert(res.message);
      } else {
        refreshList();
      }
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations
    const cleanNik = (formData.nik || '').trim();
    if (!/^\d{16}$/.test(cleanNik)) {
      setFormError('NIK harus berupa 16 digit angka.');
      return;
    }

    const cleanKk = (formData.noKk || '').trim();
    if (!/^\d{16}$/.test(cleanKk)) {
      setFormError('Nomor KK harus berupa 16 digit angka.');
      return;
    }

    if (!formData.nama?.trim()) {
      setFormError('Nama lengkap warga wajib diisi.');
      return;
    }

    if (isEditMode && selectedWarga) {
      const res = db.updateWarga(selectedWarga.id, formData);
      if (!res.success) {
        setFormError(res.message || 'Gagal memperbarui data.');
        return;
      }
    } else {
      const res = db.addWarga(formData as any);
      if (!res.success) {
        setFormError(res.message || 'Gagal menambahkan data.');
        return;
      }
    }

    setIsAddModalOpen(false);
    refreshList();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResults(null);

    const result = await db.importWargaFromExcel(file);
    setIsImporting(false);
    setImportResults(result);
    refreshList();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500 font-medium">Kependudukan · Basis Data Desa</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Master Data Kependudukan Desa Sukamaju
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data demografi dan indikator kondisi sosial ekonomi warga desa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => db.exportWargaToExcel()}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          {userRole === 'ADMIN_DESA' && (
            <button
              type="button"
              onClick={() => {
                setImportResults(null);
                setIsImportModalOpen(true);
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>Impor Massal Excel/CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Penduduk</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan NIK atau Nama..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Filter Dusun:</span>
          <select
            value={filterDusun}
            onChange={(e) => setFilterDusun(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">Semua Dusun</option>
            <option value="Dusun Krajan">Dusun Krajan</option>
            <option value="Dusun Sukamaju">Dusun Sukamaju</option>
            <option value="Dusun Wates">Dusun Wates</option>
            <option value="Dusun Sumberagung">Dusun Sumberagung</option>
          </select>
          <span className="text-xs text-slate-400 font-mono tabular-nums ml-2">
            ({filtered.length} dari {wargaList.length})
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">NIK & No. KK</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Dusun / RT / RW</th>
                <th className="py-3 px-4">Pekerjaan</th>
                <th className="py-3 px-4 text-right">Penghasilan</th>
                <th className="py-3 px-4 text-center">Tanggungan</th>
                <th className="py-3 px-4 text-center">Lansia/Disabilitas</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((w, idx) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-slate-900 tracking-wide">
                        {w.nik}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">
                        KK: {w.noKk}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{w.nama}</div>
                      <div className="text-[11px] text-slate-500">
                        {w.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {w.tempatLahir}, {w.tanggalLahir}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{w.dusun}</div>
                      <div className="text-[11px] text-slate-500">RT {w.rt} / RW {w.rw}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {w.pekerjaan}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(w.penghasilan)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums">
                      {w.jumlahTanggungan} orang
                    </td>
                    <td className="py-3 px-4 text-center">
                      {w.lansiaDisabilitas ? (
                        <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded text-[10px]">
                          Ya
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(w)}
                          title="Lihat Detail Profil Warga"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(w)}
                          title="Ubah Data"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {userRole === 'ADMIN_DESA' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(w)}
                            title="Hapus Data Penduduk"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data warga yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah / Edit Warga */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {isEditMode ? 'Perbarui Data Penduduk' : 'Tambah Data Penduduk Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* NIK & No KK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">NIK (16 Digit Angka) *</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                    placeholder="3507..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                  <span className="text-[10px] text-slate-400 font-mono">{(formData.nik || '').length}/16 digit</span>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">No. Kartu Keluarga (KK) *</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={formData.noKk}
                    onChange={(e) => setFormData({ ...formData, noKk: e.target.value.replace(/\D/g, '') })}
                    placeholder="3507..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                  <span className="text-[10px] text-slate-400 font-mono">{(formData.noKk || '').length}/16 digit</span>
                </div>
              </div>

              {/* Nama & JK */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700">Nama Lengkap Sesuai KTP *</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Nama lengkap"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Jenis Kelamin</label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              {/* Tempat & Tanggal Lahir */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tempat Lahir</label>
                  <input
                    type="text"
                    value={formData.tempatLahir}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Dusun, RT, RW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Dusun</label>
                  <select
                    value={formData.dusun}
                    onChange={(e) => setFormData({ ...formData, dusun: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Dusun Krajan">Dusun Krajan</option>
                    <option value="Dusun Sukamaju">Dusun Sukamaju</option>
                    <option value="Dusun Wates">Dusun Wates</option>
                    <option value="Dusun Sumberagung">Dusun Sumberagung</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">RT (3 Digit)</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.rt}
                    onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">RW (3 Digit)</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={formData.rw}
                    onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Alamat Jalan */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Alamat Lengkap</label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Jl. / Gang / No. Rumah"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Sosial Ekonomi */}
              <div className="pt-2 border-t border-slate-200">
                <div className="font-bold text-slate-900 mb-2">Indikator Sosial Ekonomi (Kriteria Bansos)</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Pekerjaan</label>
                    <input
                      type="text"
                      value={formData.pekerjaan}
                      onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Penghasilan Bulanan (Rp)</label>
                    <input
                      type="number"
                      step={50000}
                      value={formData.penghasilan}
                      onChange={(e) => setFormData({ ...formData, penghasilan: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Jumlah Tanggungan (Jiwa)</label>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={formData.jumlahTanggungan}
                      onChange={(e) => setFormData({ ...formData, jumlahTanggungan: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Rumah dan Fisik */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Status Kepemilikan</label>
                  <select
                    value={formData.statusRumah}
                    onChange={(e) => setFormData({ ...formData, statusRumah: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                  >
                    <option value="Milik Sendiri">Milik Sendiri</option>
                    <option value="Menumpang">Menumpang</option>
                    <option value="Sewa">Sewa</option>
                    <option value="Bukan Milik Sendiri">Bukan Milik Sendiri</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Kondisi Lantai</label>
                  <select
                    value={formData.kondisiLantai}
                    onChange={(e) => setFormData({ ...formData, kondisiLantai: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                  >
                    <option value="Tanah">Tanah</option>
                    <option value="Semen Kasar">Semen Kasar</option>
                    <option value="Keramik Rusak">Keramik Rusak</option>
                    <option value="Keramik Baik">Keramik Baik</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Kondisi Dinding</label>
                  <select
                    value={formData.kondisiDinding}
                    onChange={(e) => setFormData({ ...formData, kondisiDinding: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                  >
                    <option value="Bambu / Gedek">Bambu / Gedek</option>
                    <option value="Papan Kayu">Papan Kayu</option>
                    <option value="Tembok Tanpa Plester">Tembok Tanpa Plester</option>
                    <option value="Tembok Diplester">Tembok Diplester</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Kondisi Atap</label>
                  <select
                    value={formData.kondisiAtap}
                    onChange={(e) => setFormData({ ...formData, kondisiAtap: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                  >
                    <option value="Rumbia / Ijuk">Rumbia / Ijuk</option>
                    <option value="Seng Berkarat">Seng Berkarat</option>
                    <option value="Genteng Tanah">Genteng Tanah</option>
                    <option value="Genteng Baik">Genteng Baik</option>
                  </select>
                </div>
              </div>

              {/* Listrik & Lansia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Daya Listrik</label>
                  <select
                    value={formData.dayaListrik}
                    onChange={(e) => setFormData({ ...formData, dayaListrik: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Non-PLN / 450 VA">Non-PLN / 450 VA</option>
                    <option value="900 VA">900 VA</option>
                    <option value="1300 VA+">1300 VA+</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.lansiaDisabilitas}
                      onChange={(e) => setFormData({ ...formData, lansiaDisabilitas: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300"
                    />
                    <span>Ada Anggota Keluarga Lansia / Disabilitas Berat</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>{isEditMode ? 'Simpan Perubahan' : 'Tambahkan Penduduk'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail Warga */}
      {isDetailModalOpen && selectedWarga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">{selectedWarga.nama}</h3>
                <div className="text-[11px] text-slate-400 font-mono">NIK: {selectedWarga.nik}</div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">No. KK:</span>
                  <span className="font-mono font-semibold text-slate-900">{selectedWarga.noKk}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Jenis Kelamin:</span>
                  <span className="font-semibold text-slate-900">{selectedWarga.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tempat, Tanggal Lahir:</span>
                  <span className="font-semibold text-slate-900">{selectedWarga.tempatLahir}, {selectedWarga.tanggalLahir}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Wilayah:</span>
                  <span className="font-semibold text-slate-900">{selectedWarga.dusun} (RT {selectedWarga.rt} / RW {selectedWarga.rw})</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-900 block">Kondisi Sosial Ekonomi & Rumah:</span>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>· Pekerjaan: <strong>{selectedWarga.pekerjaan}</strong></div>
                  <div>· Penghasilan: <strong className="font-mono">{formatRupiah(selectedWarga.penghasilan)}</strong></div>
                  <div>· Tanggungan: <strong>{selectedWarga.jumlahTanggungan} Jiwa</strong></div>
                  <div>· Status Rumah: <strong>{selectedWarga.statusRumah}</strong></div>
                  <div>· Lantai: <strong>{selectedWarga.kondisiLantai}</strong></div>
                  <div>· Dinding: <strong>{selectedWarga.kondisiDinding}</strong></div>
                  <div>· Atap: <strong>{selectedWarga.kondisiAtap}</strong></div>
                  <div>· Listrik: <strong>{selectedWarga.dayaListrik}</strong></div>
                  <div className="col-span-2">
                    · Lansia/Disabilitas: <strong>{selectedWarga.lansiaDisabilitas ? 'Ada (Keluarga Rentan)' : 'Tidak Ada'}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Import Excel/CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Impor Data Kependudukan Massal (.xlsx / .csv)
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Unggah file rekapitulasi data penduduk dari Disdukcapil atau survei RT dalam format Excel (.xlsx) atau CSV.
              </p>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-900 space-y-1">
                <div className="font-semibold">Format Header Kolom yang Diterima:</div>
                <div className="font-mono text-[11px] text-blue-800">
                  NIK | Nama | No KK | Dusun | RT | RW | Pekerjaan | Penghasilan | Tanggungan
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2 hover:bg-slate-50 transition-colors">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs text-slate-700 font-medium">
                  {isImporting ? 'Sedang memproses dan memvalidasi baris data...' : 'Pilih file Excel dari komputer Anda'}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold inline-flex items-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Pilih File Spreadsheet</span>
                </button>
              </div>

              {/* Import Results Feedback */}
              {importResults && (
                <div className={`p-4 rounded-xl border space-y-2 ${
                  importResults.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {importResults.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                    <span>{importResults.importedCount} data berhasil ditambahkan ke database.</span>
                  </div>
                  {importResults.errors && importResults.errors.length > 0 && (
                    <div className="space-y-1 text-[11px] text-rose-700 max-h-32 overflow-y-auto pt-2 border-t border-rose-200">
                      <span className="font-semibold block">Catatan baris diabaikan:</span>
                      {importResults.errors.map((err, i) => (
                        <div key={i}>· {err}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
