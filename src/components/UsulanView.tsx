import React, { useState } from 'react';
import { db } from '../services/storage';
import { UsulanBansos, Warga, UserRole, StatusUsulan } from '../types';
import { formatRupiah, hitungSkorKelayakan } from '../utils/scoring';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Camera, 
  FileText, 
  AlertTriangle,
  User,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Eye,
  X,
  FileCheck2,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface UsulanViewProps {
  userRole: UserRole;
}

export const UsulanView: React.FC<UsulanViewProps> = ({ userRole }) => {
  const [usulanList, setUsulanList] = useState<UsulanBansos[]>(db.getUsulan());
  const [wargaList, setWargaList] = useState<Warga[]>(db.getWarga());
  const [programs] = useState(db.getPrograms());
  
  // Tabs filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | StatusUsulan>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedUsulan, setSelectedUsulan] = useState<UsulanBansos | null>(null);

  // New Proposal Form
  const [selectedWargaId, setSelectedWargaId] = useState('');
  const [catatanPetugas, setCatatanPetugas] = useState('');
  const [fotoKtp, setFotoKtp] = useState('https://images.unsplash.com/photo-1544717305-2782549b5136?w=400');
  const [fotoKk, setFotoKk] = useState('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400');
  const [fotoDepan, setFotoDepan] = useState('https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=500');
  const [fotoDalam, setFotoDalam] = useState('https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500');
  const [rekomendasiProgId, setRekomendasiProgId] = useState(programs[0]?.id || '');
  const [formError, setFormError] = useState('');

  // Action form state
  const [actionNotes, setActionNotes] = useState('');

  const refreshData = () => {
    setUsulanList(db.getUsulan());
    setWargaList(db.getWarga());
  };

  const filtered = usulanList.filter(u => {
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    const matchesSearch = 
      u.warga.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.warga.nik.includes(searchTerm) ||
      u.pengusulNama.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate live score preview when a resident is selected
  const activeSelectedWarga = wargaList.find(w => w.id === selectedWargaId);
  const previewScore = activeSelectedWarga ? hitungSkorKelayakan(activeSelectedWarga) : null;

  const handleOpenCreate = () => {
    // default to first citizen that does not have an active proposal
    const available = wargaList.find(w => !usulanList.some(u => u.wargaId === w.id));
    setSelectedWargaId(available ? available.id : (wargaList[0]?.id || ''));
    setCatatanPetugas('Keluarga sangat membutuhkan bantuan darurat pangan dan papan.');
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedWargaId) {
      setFormError('Pilih warga yang akan diusulkan.');
      return;
    }

    const res = db.createUsulan({
      wargaId: selectedWargaId,
      catatanPetugas,
      fotoKtp,
      fotoKk,
      fotoRumahDepan: fotoDepan,
      fotoRumahDalam: fotoDalam,
      rekomendasiProgramId: rekomendasiProgId
    });

    if (!res.success) {
      setFormError(res.message || 'Gagal menyimpan usulan.');
      return;
    }

    setIsCreateModalOpen(false);
    refreshData();
  };

  const handleOpenVerify = (u: UsulanBansos) => {
    setSelectedUsulan(u);
    setActionNotes('Berkas kependudukan dan foto kondisi rumah telah diverifikasi fisik di lapangan.');
    setIsVerifyModalOpen(true);
  };

  const handleExecuteVerify = (status: 'MENUNGGU_PERSETUJUAN_KADES' | 'DITOLAK') => {
    if (!selectedUsulan) return;
    const res = db.verifyUsulanAdmin(selectedUsulan.id, actionNotes, status);
    if (res.success) {
      setIsVerifyModalOpen(false);
      refreshData();
    }
  };

  const handleOpenApprove = (u: UsulanBansos) => {
    setSelectedUsulan(u);
    setActionNotes('Disetujui untuk dimasukkan dalam Surat Keputusan (SK) Penetapan KPM Bantuan Sosial Desa.');
    setIsApproveModalOpen(true);
  };

  const handleExecuteApprove = (approved: boolean) => {
    if (!selectedUsulan) return;
    const res = db.approveUsulanKades(selectedUsulan.id, actionNotes, approved);
    if (res.success) {
      setIsApproveModalOpen(false);
      refreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500 font-medium">Verifikasi Kelayakan & Scoring System</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
            Usulan Penerima & Alur Persetujuan Bertingkat
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengusulan warga pra-sejahtera oleh RT/RW, audit berkas Kaur Kesra, dan pengesahan Kepala Desa.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Input Usulan Warga Baru</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({usulanList.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('MENUNGGU_VERIFIKASI_ADMIN')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'MENUNGGU_VERIFIKASI_ADMIN' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Verifikasi Admin ({usulanList.filter(u => u.status === 'MENUNGGU_VERIFIKASI_ADMIN').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('MENUNGGU_PERSETUJUAN_KADES')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'MENUNGGU_PERSETUJUAN_KADES' ? 'bg-white text-amber-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Persetujuan Kades ({usulanList.filter(u => u.status === 'MENUNGGU_PERSETUJUAN_KADES').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('DISETUJUI')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'DISETUJUI' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Disetujui ({usulanList.filter(u => u.status === 'DISETUJUI').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('DITOLAK')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'DITOLAK' ? 'bg-white text-rose-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ditolak ({usulanList.filter(u => u.status === 'DITOLAK').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama atau NIK..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Usulan Table List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Nama KPM & NIK</th>
                <th className="py-3 px-4">Dusun / RT</th>
                <th className="py-3 px-4 text-center">Skor Kelayakan</th>
                <th className="py-3 px-4">Rekomendasi Program</th>
                <th className="py-3 px-4">Pengusul (RT/RW)</th>
                <th className="py-3 px-4 text-center">Status Alur</th>
                <th className="py-3 px-4 text-center">Aksi / Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{item.warga.nama}</div>
                      <div className="font-mono text-[11px] text-slate-500">{item.warga.nik}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.warga.pekerjaan} · {formatRupiah(item.warga.penghasilan)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{item.warga.dusun}</div>
                      <div className="text-[11px] text-slate-500">RT {item.warga.rt} / RW {item.warga.rw}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`text-base font-extrabold font-mono tabular-nums ${
                          item.skorKelayakan >= 70 ? 'text-emerald-700' :
                          item.skorKelayakan >= 50 ? 'text-amber-700' :
                          'text-rose-700'
                        }`}>
                          {item.skorKelayakan}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          item.kategoriKelayakan === 'SANGAT_LAYAK' ? 'bg-emerald-100 text-emerald-800' :
                          item.kategoriKelayakan === 'LAYAK' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {item.kategoriKelayakan.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {programs.find(p => p.id === item.rekomendasiProgramId)?.nama || 'Program Bantuan Desa'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {programs.find(p => p.id === item.rekomendasiProgramId)?.sumberDana || 'Dana Desa'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{item.pengusulNama}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-block">
                        {item.status === 'MENUNGGU_VERIFIKASI_ADMIN' && (
                          <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 font-semibold rounded-md text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Verifikasi Admin</span>
                          </span>
                        )}
                        {item.status === 'MENUNGGU_PERSETUJUAN_KADES' && (
                          <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 font-semibold rounded-md text-[11px] flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Persetujuan Kades</span>
                          </span>
                        )}
                        {item.status === 'DISETUJUI' && (
                          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold rounded-md text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Disetujui Sah</span>
                          </span>
                        )}
                        {item.status === 'DITOLAK' && (
                          <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-800 font-semibold rounded-md text-[11px] flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>Ditolak</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUsulan(item);
                            setIsDetailModalOpen(true);
                          }}
                          title="Lihat Berkas & Detail Skor"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors flex items-center gap-1 font-medium text-[11px]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Berkas</span>
                        </button>

                        {/* Admin verification button */}
                        {userRole === 'ADMIN_DESA' && item.status === 'MENUNGGU_VERIFIKASI_ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handleOpenVerify(item)}
                            className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors font-semibold text-[11px] flex items-center gap-1"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Verifikasi</span>
                          </button>
                        )}

                        {/* Kades Approval button */}
                        {userRole === 'KEPALA_DESA' && item.status === 'MENUNGGU_PERSETUJUAN_KADES' && (
                          <button
                            type="button"
                            onClick={() => handleOpenApprove(item)}
                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-md transition-colors text-[11px] flex items-center gap-1 shadow-2xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Approval</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada usulan dalam kategori ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Input Usulan Warga Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-blue-400" />
                  Form Pengusulan Warga Penerima Bantuan (Petugas Lapangan / RT)
                </h3>
                <p className="text-[11px] text-slate-400">Ajukan warga miskin atau rentan dengan skoring otomatis</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Citizen Selector */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Pilih Warga Terdaftar (KPM) *</label>
                <select
                  value={selectedWargaId}
                  onChange={(e) => setSelectedWargaId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                  required
                >
                  <option value="">-- Pilih Warga dari Master Kependudukan --</option>
                  {wargaList.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.nama} (NIK: {w.nik}) · {w.dusun} RT {w.rt} · {w.pekerjaan}
                    </option>
                  ))}
                </select>
              </div>

              {/* Automatic Scoring Preview Box */}
              {previewScore && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Hasil Skoring Kelayakan Otomatis:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-mono text-blue-900 tabular-nums">
                        {previewScore.skor} / 100
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        previewScore.kategori === 'SANGAT_LAYAK' ? 'bg-emerald-100 text-emerald-800' :
                        previewScore.kategori === 'LAYAK' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {previewScore.kategori.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-blue-200/60 text-[11px] text-slate-600">
                    <div>Penghasilan: <strong>{previewScore.rincian.penghasilanScore}/35</strong></div>
                    <div>Perumahan: <strong>{previewScore.rincian.perumahanScore}/30</strong></div>
                    <div>Tanggungan: <strong>{previewScore.rincian.tanggunganScore}/20</strong></div>
                    <div>Kerentanan: <strong>{previewScore.rincian.kerentananScore}/15</strong></div>
                  </div>
                </div>
              )}

              {/* Target Program Recommendation */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Rekomendasi Program Bantuan *</label>
                <select
                  value={rekomendasiProgId}
                  onChange={(e) => setRekomendasiProgId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nama} ({p.sumberDana}) - {p.jenis === 'Uang Tunai' ? formatRupiah(p.nominalPerKpm) : p.keteranganBarang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Catatan Observasi Petugas Lapangan *</label>
                <textarea
                  rows={3}
                  value={catatanPetugas}
                  onChange={(e) => setCatatanPetugas(e.target.value)}
                  placeholder="Ceritakan kondisi riil keluarga, mata pencaharian, atau alasan mendesak bantuan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Photo Evidence Inputs */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Dokumentasi Foto Berkas & Kondisi Fisik Rumah
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="space-y-1">
                    <label className="text-slate-600">Foto KTP Warga</label>
                    <input
                      type="text"
                      value={fotoKtp}
                      onChange={(e) => setFotoKtp(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600">Foto Kartu Keluarga (KK)</label>
                    <input
                      type="text"
                      value={fotoKk}
                      onChange={(e) => setFotoKk(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600">Foto Rumah Tampak Depan</label>
                    <input
                      type="text"
                      value={fotoDepan}
                      onChange={(e) => setFotoDepan(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600">Foto Rumah Bagian Dalam / Lantai</label>
                    <input
                      type="text"
                      value={fotoDalam}
                      onChange={(e) => setFotoDalam(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono text-[10px]"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Kirim Usulan ke Kaur Kesra</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail Berkas Usulan */}
      {isDetailModalOpen && selectedUsulan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Berkas Usulan: {selectedUsulan.warga.nama}</h3>
                <div className="text-[11px] text-slate-400 font-mono">NIK: {selectedUsulan.warga.nik}</div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Scoring summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block">Kategori Kelayakan Kemiskinan:</span>
                  <span className={`text-sm font-bold ${
                    selectedUsulan.skorKelayakan >= 70 ? 'text-emerald-700' :
                    selectedUsulan.skorKelayakan >= 50 ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {selectedUsulan.kategoriKelayakan.replace('_', ' ')} (Skor: {selectedUsulan.skorKelayakan}/100)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Status Alur Berkas:</span>
                  <span className="font-bold text-slate-900">{selectedUsulan.status.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {/* Photo Evidence Grid */}
              <div className="space-y-2">
                <span className="font-bold text-slate-900 block">Dokumentasi Foto Lapangan:</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500">Tampak Depan Rumah:</span>
                    <div className="h-36 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <img 
                        src={selectedUsulan.fotoRumahDepan || 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=500'} 
                        alt="Foto Rumah Depan" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500">Kondisi Dalam / Lantai:</span>
                    <div className="h-36 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <img 
                        src={selectedUsulan.fotoRumahDalam || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500'} 
                        alt="Foto Rumah Dalam" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes timeline */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900 block">Riwayat Catatan Petugas & Pejabat:</span>
                <div className="space-y-2">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="font-semibold text-slate-800">1. Catatan Pengusul ({selectedUsulan.pengusulNama}):</span>
                    <p className="text-slate-600 mt-0.5">{selectedUsulan.catatanPetugas}</p>
                  </div>
                  {selectedUsulan.catatanAdmin && (
                    <div className="bg-blue-50/70 p-2.5 rounded border border-blue-200 text-blue-900">
                      <span className="font-semibold">2. Verifikasi Kaur Kesra ({selectedUsulan.diverifikasiOleh}):</span>
                      <p className="mt-0.5">{selectedUsulan.catatanAdmin}</p>
                    </div>
                  )}
                  {selectedUsulan.catatanKades && (
                    <div className="bg-emerald-50/70 p-2.5 rounded border border-emerald-200 text-emerald-900">
                      <span className="font-semibold">3. Keputusan Kepala Desa ({selectedUsulan.disetujuiOleh}):</span>
                      <p className="mt-0.5">{selectedUsulan.catatanKades}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Verifikasi Admin Desa */}
      {isVerifyModalOpen && selectedUsulan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileCheck2 className="w-4 h-4" />
                Verifikasi Berkas Kependudukan (Kaur Kesra)
              </h3>
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="text-slate-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-slate-500">Calon KPM:</span>
                <div className="font-bold text-slate-900 text-sm">{selectedUsulan.warga.nama} (NIK: {selectedUsulan.warga.nik})</div>
                <div className="text-slate-600">Skor: {selectedUsulan.skorKelayakan} · {selectedUsulan.warga.dusun}</div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Catatan Hasil Verifikasi Lapangan *</label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleExecuteVerify('DITOLAK')}
                  className="px-3.5 py-2 text-rose-700 hover:bg-rose-50 border border-rose-300 rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>Tolak Berkas</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteVerify('MENUNGGU_PERSETUJUAN_KADES')}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Loloskan ke Kepala Desa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Approval Kepala Desa */}
      {isApproveModalOpen && selectedUsulan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-amber-500 px-6 py-4 text-slate-950 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Persetujuan Akhir (Approval SK Kepala Desa)
              </h3>
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="text-slate-800 hover:text-black p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <span className="text-amber-900 font-semibold block">Wewenang Kepala Desa:</span>
                <p className="text-amber-800 mt-0.5">
                  Menetapkan usulan KPM <strong>{selectedUsulan.warga.nama}</strong> masuk ke dalam daftar penerima bantuan sosial sah.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Catatan Penetapan / SK *</label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleExecuteApprove(false)}
                  className="px-3.5 py-2 text-rose-700 hover:bg-rose-50 border border-rose-300 rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>Tolak Penetapan</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteApprove(true)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Sahkan & Setujui (Approve)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
