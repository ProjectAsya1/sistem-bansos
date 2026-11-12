import React, { useState } from 'react';
import { db } from '../services/storage';
import { PenyaluranJadwal, PenerimaPenyaluran, UserRole, ProgramBansos, Warga } from '../types';
import { formatRupiah, maskNik } from '../utils/scoring';
import { SignatureCanvas } from './SignatureCanvas';
import { 
  Truck, 
  Calendar, 
  MapPin, 
  Clock, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Camera, 
  PenTool, 
  Search, 
  Eye, 
  X, 
  Check, 
  User, 
  Phone 
} from 'lucide-react';

interface PenyaluranViewProps {
  userRole: UserRole;
}

export const PenyaluranView: React.FC<PenyaluranViewProps> = ({ userRole }) => {
  const [jadwalList, setJadwalList] = useState<PenyaluranJadwal[]>(db.getJadwal());
  const [selectedJadwalId, setSelectedJadwalId] = useState<string>(jadwalList[0]?.id || '');
  const [penerimaList, setPenerimaList] = useState<PenerimaPenyaluran[]>(db.getAllPenerima());

  const [programs] = useState<ProgramBansos[]>(db.getPrograms());
  const [wargaList] = useState<Warga[]>(db.getWarga());
  const usulanList = db.getUsulan();

  // Filter state for recipients table
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'BELUM_DISALURKAN' | 'SUDAH_DISALURKAN' | 'GAGAL_DISALURKAN'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateJadwalOpen, setIsCreateJadwalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [isFailedModalOpen, setIsFailedModalOpen] = useState(false);
  const [isDetailProofModalOpen, setIsDetailProofModalOpen] = useState(false);
  const [activePenerima, setActivePenerima] = useState<PenerimaPenyaluran | null>(null);

  // Handover confirmation form
  const [penerimaRiil, setPenerimaRiil] = useState('');
  const [hubunganKpm, setHubunganKpm] = useState<'Yang Bersangkutan' | 'Suami/Istri' | 'Anak' | 'Anggota Keluarga Lain'>('Yang Bersangkutan');
  const [fotoBukti, setFotoBukti] = useState('https://images.unsplash.com/photo-1544717305-2782549b5136?w=400');
  const [tandaTangan, setTandaTangan] = useState('');
  const [catatanHandover, setCatatanHandover] = useState('');
  const [handoverError, setHandoverError] = useState('');

  // Failed form
  const [alasanGagal, setAlasanGagal] = useState('Pindah Domisili ke Luar Desa');

  // Create schedule form
  const [newJadwalProgramId, setNewJadwalProgramId] = useState(programs[0]?.id || '');
  const [newJadwalJudul, setNewJadwalJudul] = useState('');
  const [newJadwalTanggal, setNewJadwalTanggal] = useState('2026-03-25');
  const [newJadwalWaktu, setNewJadwalWaktu] = useState('09:00 - 13:00 WIB');
  const [newJadwalLokasi, setNewJadwalLokasi] = useState('Pendopo Balai Desa Sukamaju');
  const [newJadwalPetugas, setNewJadwalPetugas] = useState('Budi Hartono (Kaur Kesra)');
  const [newJadwalKontak, setNewJadwalKontak] = useState('0812-3456-7890');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [scheduleError, setScheduleError] = useState('');

  const refreshData = () => {
    setJadwalList(db.getJadwal());
    setPenerimaList(db.getAllPenerima());
  };

  const activeJadwal = jadwalList.find(j => j.id === selectedJadwalId) || jadwalList[0];
  const recipientsInJadwal = penerimaList.filter(p => p.jadwalId === activeJadwal?.id);

  const filteredRecipients = recipientsInJadwal.filter(p => {
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchesSearch = 
      p.warga.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.warga.nik.includes(searchTerm) ||
      (p.namaPenerimaNyata && p.namaPenerimaNyata.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Handover triggers
  const handleOpenHandover = (p: PenerimaPenyaluran) => {
    setActivePenerima(p);
    setPenerimaRiil(p.warga.nama);
    setHubunganKpm('Yang Bersangkutan');
    setFotoBukti('https://images.unsplash.com/photo-1544717305-2782549b5136?w=400');
    setTandaTangan('');
    setCatatanHandover('Bantuan diserahkan secara utuh tanpa potongan.');
    setHandoverError('');
    setIsHandoverModalOpen(true);
  };

  const handleSubmitHandover = (e: React.FormEvent) => {
    e.preventDefault();
    setHandoverError('');

    if (!activePenerima) return;
    if (!penerimaRiil.trim()) {
      setHandoverError('Nama penerima riil wajib diisi.');
      return;
    }

    // Handover signature or default signature path
    const finalSignature = tandaTangan || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M20 50 Q 60 20, 100 50 T 180 40" stroke="black" stroke-width="3" fill="none"/></svg>';

    const res = db.confirmDistribusiSuccess({
      penerimaId: activePenerima.id,
      namaPenerimaNyata: penerimaRiil,
      hubunganDenganKpm: hubunganKpm,
      fotoBukti,
      tandaTangan: finalSignature,
      catatan: catatanHandover
    });

    if (!res.success) {
      setHandoverError(res.message || 'Gagal menyimpan serah terima.');
      return;
    }

    setIsHandoverModalOpen(false);
    refreshData();
  };

  const handleOpenFailed = (p: PenerimaPenyaluran) => {
    setActivePenerima(p);
    setAlasanGagal('Pindah Domisili ke Luar Desa');
    setIsFailedModalOpen(true);
  };

  const handleSubmitFailed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePenerima) return;

    db.confirmDistribusiGagal(activePenerima.id, alasanGagal);
    setIsFailedModalOpen(false);
    refreshData();
  };

  // Open Create Schedule Modal
  const handleOpenCreateJadwal = () => {
    const prog = programs[0];
    setNewJadwalProgramId(prog ? prog.id : '');
    setNewJadwalJudul(`Penyaluran ${prog?.nama || 'Bansos'} Periode Ini`);
    // Pre-select approved citizens who are not yet delivered in this program
    const approvedWarga = usulanList
      .filter(u => u.status === 'DISETUJUI')
      .map(u => u.wargaId);
    setSelectedRecipientIds(approvedWarga.slice(0, 5));
    setScheduleError('');
    setIsCreateJadwalOpen(true);
  };

  const handleSubmitCreateJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError('');

    if (!newJadwalJudul.trim()) {
      setScheduleError('Judul jadwal penyaluran wajib diisi.');
      return;
    }

    if (selectedRecipientIds.length === 0) {
      setScheduleError('Pilih minimal 1 warga penerima (KPM).');
      return;
    }

    const prog = programs.find(p => p.id === newJadwalProgramId);
    const res = db.createJadwal({
      programId: newJadwalProgramId,
      programNama: prog?.nama || 'Program Bantuan',
      judul: newJadwalJudul,
      tanggal: newJadwalTanggal,
      waktu: newJadwalWaktu,
      lokasi: newJadwalLokasi,
      petugasPenanggungJawab: newJadwalPetugas,
      kontakPetugas: newJadwalKontak,
      status: 'BERLANGSUNG'
    }, selectedRecipientIds);

    if (!res.success) {
      setScheduleError(res.message || 'Gagal membuat jadwal.');
      return;
    }

    if (res.jadwal) {
      setSelectedJadwalId(res.jadwal.id);
    }
    setIsCreateJadwalOpen(false);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500 font-medium">Distribusi Lapangan · Bukti Serah Terima Real-Time</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Monitoring Penyaluran & Bukti Digital Serah Terima
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfirmasi distribusi bantuan langsung dengan foto penyerahan dan tanda tangan digital KPM.
          </p>
        </div>

        {userRole === 'ADMIN_DESA' && (
          <button
            type="button"
            onClick={handleOpenCreateJadwal}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Jadwal Penyaluran</span>
          </button>
        )}
      </div>

      {/* Schedule Picker Cards */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-700 block">Pilih Agenda Jadwal Penyaluran:</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {jadwalList.map(jdw => {
            const isSelected = jdw.id === activeJadwal?.id;
            const completionPct = jdw.totalSasaran > 0 ? ((jdw.totalTersalurkan / jdw.totalSasaran) * 100) : 0;

            return (
              <div
                key={jdw.id}
                onClick={() => setSelectedJadwalId(jdw.id)}
                className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-600 shadow-sm ring-1 ring-blue-600'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                      {jdw.programNama}
                    </span>
                    <h2 className="text-xs font-bold text-slate-900 mt-0.5">{jdw.judul}</h2>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    jdw.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-800' :
                    jdw.status === 'BERLANGSUNG' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {jdw.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mt-2.5 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{jdw.tanggal} ({jdw.waktu})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{jdw.lokasi}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
                    <span className="text-slate-500">Progres Penyerahan:</span>
                    <span className="font-bold text-slate-900">
                      {jdw.totalTersalurkan} dari {jdw.totalSasaran} KPM ({completionPct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${completionPct}%` }}
                      className="h-full bg-blue-600 rounded-full"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recipient queue table */}
      {activeJadwal && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Daftar Penerima Manfaat (KPM) di Lokasi Penyaluran
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                Penanggung Jawab: <strong className="text-slate-800">{activeJadwal.petugasPenanggungJawab}</strong> ({activeJadwal.kontakPetugas})
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={`px-2.5 py-1 rounded font-medium ${
                  filterStatus === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Semua ({recipientsInJadwal.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('BELUM_DISALURKAN')}
                className={`px-2.5 py-1 rounded font-medium ${
                  filterStatus === 'BELUM_DISALURKAN' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Antrean ({recipientsInJadwal.filter(p => p.status === 'BELUM_DISALURKAN').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('SUDAH_DISALURKAN')}
                className={`px-2.5 py-1 rounded font-medium ${
                  filterStatus === 'SUDAH_DISALURKAN' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Sudah ({recipientsInJadwal.filter(p => p.status === 'SUDAH_DISALURKAN').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('GAGAL_DISALURKAN')}
                className={`px-2.5 py-1 rounded font-medium ${
                  filterStatus === 'GAGAL_DISALURKAN' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Gagal ({recipientsInJadwal.filter(p => p.status === 'GAGAL_DISALURKAN').length})
              </button>
            </div>
          </div>

          {/* Search in queue */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama KPM di antrean..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama KPM & NIK</th>
                  <th className="py-3 px-4">Dusun / RT</th>
                  <th className="py-3 px-4">Status Distribusi</th>
                  <th className="py-3 px-4">Penerima Riil & Waktu</th>
                  <th className="py-3 px-4 text-center">Bukti / Tanda Tangan</th>
                  <th className="py-3 px-4 text-center">Aksi Lapangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecipients.length > 0 ? (
                  filteredRecipients.map((rec, idx) => (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{rec.warga.nama}</div>
                        <div className="font-mono text-[11px] text-slate-500">{rec.warga.nik}</div>
                        <div className="text-[10px] text-slate-400">KK: {rec.warga.noKk}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{rec.warga.dusun}</div>
                        <div className="text-[11px] text-slate-500">RT {rec.warga.rt} / RW {rec.warga.rw}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {rec.status === 'SUDAH_DISALURKAN' && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[11px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Sudah Disalurkan</span>
                          </span>
                        )}
                        {rec.status === 'BELUM_DISALURKAN' && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[11px] inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Belum Disalurkan</span>
                          </span>
                        )}
                        {rec.status === 'GAGAL_DISALURKAN' && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-[11px] inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Gagal Salur</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {rec.status === 'SUDAH_DISALURKAN' ? (
                          <div>
                            <div className="font-semibold text-slate-900">{rec.namaPenerimaNyata}</div>
                            <div className="text-[11px] text-slate-500">({rec.hubunganDenganKpm})</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {rec.waktuSerahTerima ? new Date(rec.waktuSerahTerima).toLocaleString('id-ID') : '-'}
                            </div>
                          </div>
                        ) : rec.status === 'GAGAL_DISALURKAN' ? (
                          <div className="text-rose-700 text-[11px] font-medium">
                            Alasan: {rec.alasanGagal}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Menunggu giliran di lokasi</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {rec.status === 'SUDAH_DISALURKAN' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActivePenerima(rec);
                              setIsDetailProofModalOpen(true);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat Bukti TTD</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {rec.status === 'BELUM_DISALURKAN' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenHandover(rec)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Konfirmasi Diterima</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenFailed(rec)}
                              className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded font-medium text-[11px]"
                              title="Tandai Gagal Salur"
                            >
                              Gagal Salur
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada KPM dalam antrean ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Serah Terima (Bukti Digital + Tanda Tangan Canvas) */}
      {isHandoverModalOpen && activePenerima && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full my-8 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-emerald-800 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Konfirmasi Serah Terima Bantuan Sosial
                </h3>
                <p className="text-[11px] text-emerald-200">KPM: {activePenerima.warga.nama} (NIK: {activePenerima.warga.nik})</p>
              </div>
              <button
                type="button"
                onClick={() => setIsHandoverModalOpen(false)}
                className="text-emerald-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitHandover} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {handoverError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{handoverError}</span>
                </div>
              )}

              {/* Penerima Riil */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Nama Penerima Langsung *</label>
                  <input
                    type="text"
                    value={penerimaRiil}
                    onChange={(e) => setPenerimaRiil(e.target.value)}
                    placeholder="Nama orang yang menerima di tempat"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Hubungan dengan KPM</label>
                  <select
                    value={hubunganKpm}
                    onChange={(e) => setHubunganKpm(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Yang Bersangkutan">Yang Bersangkutan Langsung</option>
                    <option value="Suami/Istri">Suami / Istri Sah</option>
                    <option value="Anak">Anak Kandung</option>
                    <option value="Anggota Keluarga Lain">Anggota Keluarga dalam 1 KK</option>
                  </select>
                </div>
              </div>

              {/* Foto Bukti Penyerahan */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  Foto Dokumentasi Penyerahan di Lapangan *
                </label>
                <input
                  type="text"
                  value={fotoBukti}
                  onChange={(e) => setFotoBukti(e.target.value)}
                  placeholder="URL Foto atau ambil dari kamera HP"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px]"
                  required
                />
                <div className="h-28 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 mt-1">
                  <img src={fotoBukti} alt="Preview Foto" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Interactive Digital Canvas Signature */}
              <div className="pt-2 border-t border-slate-200">
                <SignatureCanvas
                  onSave={(dataUrl) => setTandaTangan(dataUrl)}
                />
              </div>

              {/* Catatan */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Catatan Petugas</label>
                <input
                  type="text"
                  value={catatanHandover}
                  onChange={(e) => setCatatanHandover(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Bukti Serah Terima</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Pencatatan Gagal Salur */}
      {isFailedModalOpen && activePenerima && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-rose-800 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Catatan Bantuan Gagal Disalurkan
              </h3>
              <button
                type="button"
                onClick={() => setIsFailedModalOpen(false)}
                className="text-rose-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFailed} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Pencatatan ini akan dilaporkan dalam Berita Acara Rekonsiliasi Penyaluran Bansos Desa.
              </p>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Pilih Alasan Gagal Salur *</label>
                <select
                  value={alasanGagal}
                  onChange={(e) => setAlasanGagal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="Pindah Domisili ke Luar Desa">Pindah Domisili ke Luar Desa</option>
                  <option value="Meninggal Dunia Tanpa Ahli Waris">Meninggal Dunia Tanpa Ahli Waris</option>
                  <option value="Menolak Bantuan (Sudah Mampu Mandiri)">Menolak Bantuan (Sudah Mampu Mandiri)</option>
                  <option value="Tidak Hadir Setelah 3x Panggilan Resmi">Tidak Hadir Setelah 3x Panggilan Resmi</option>
                  <option value="Duplikasi Bantuan di Program Lain">Duplikasi Bantuan di Program Lain</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFailedModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg shadow-sm"
                >
                  Simpan Status Gagal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Lihat Bukti & Tanda Tangan Sah */}
      {isDetailProofModalOpen && activePenerima && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Bukti Digital Serah Terima Sah</h3>
                <div className="text-[11px] text-slate-400 font-mono">NIK: {activePenerima.warga.nik}</div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailProofModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div>KPM: <strong>{activePenerima.warga.nama}</strong> ({activePenerima.warga.dusun})</div>
                <div>Penerima Riil: <strong>{activePenerima.namaPenerimaNyata}</strong> ({activePenerima.hubunganDenganKpm})</div>
                <div>Waktu Serah Terima: <span className="font-mono">{activePenerima.waktuSerahTerima ? new Date(activePenerima.waktuSerahTerima).toLocaleString('id-ID') : '-'}</span></div>
                <div>Petugas Lapangan: <strong>{activePenerima.petugasPenyalur || '-'}</strong></div>
              </div>

              {/* Photos & Signatures */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">Foto Dokumentasi Lapangan:</span>
                <div className="h-40 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  <img src={activePenerima.fotoBukti || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400'} alt="Foto Bukti" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-800 block">Tanda Tangan Digital Penerima:</span>
                <div className="h-24 bg-white rounded-lg border border-slate-300 flex items-center justify-center p-2">
                  {activePenerima.tandaTangan ? (
                    <img src={activePenerima.tandaTangan} alt="Tanda Tangan" className="h-full object-contain" />
                  ) : (
                    <span className="text-slate-400 italic">Tanda tangan tersimpan secara digital</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsDetailProofModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Buat Jadwal Penyaluran Baru */}
      {isCreateJadwalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Buat Jadwal & Penetapan Penerima Penyaluran
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateJadwalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreateJadwal} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {scheduleError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{scheduleError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Program Bantuan *</label>
                <select
                  value={newJadwalProgramId}
                  onChange={(e) => {
                    setNewJadwalProgramId(e.target.value);
                    const p = programs.find(pr => pr.id === e.target.value);
                    setNewJadwalJudul(`Penyaluran ${p?.nama || 'Bansos'}`);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nama} ({p.sumberDana}) - Kuota: {p.kuota}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Judul Agenda Penyaluran *</label>
                <input
                  type="text"
                  value={newJadwalJudul}
                  onChange={(e) => setNewJadwalJudul(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tanggal Pelaksanaan *</label>
                  <input
                    type="date"
                    value={newJadwalTanggal}
                    onChange={(e) => setNewJadwalTanggal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Waktu / Pukul *</label>
                  <input
                    type="text"
                    value={newJadwalWaktu}
                    onChange={(e) => setNewJadwalWaktu(e.target.value)}
                    placeholder="08:30 - 12:00 WIB"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Lokasi Penyaluran *</label>
                <input
                  type="text"
                  value={newJadwalLokasi}
                  onChange={(e) => setNewJadwalLokasi(e.target.value)}
                  placeholder="Pendopo Balai Desa Sukamaju / Balai Dusun"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Petugas Penanggung Jawab *</label>
                  <input
                    type="text"
                    value={newJadwalPetugas}
                    onChange={(e) => setNewJadwalPetugas(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">No. Kontak HP Petugas *</label>
                  <input
                    type="text"
                    value={newJadwalKontak}
                    onChange={(e) => setNewJadwalKontak(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Citizen Checkbox Selector */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800">
                    Pilih Warga KPM Penerima ({selectedRecipientIds.length} Terpilih):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = wargaList.map(w => w.id);
                      setSelectedRecipientIds(allIds);
                    }}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Pilih Semua
                  </button>
                </div>

                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                  {wargaList.map(w => {
                    const isChecked = selectedRecipientIds.includes(w.id);
                    return (
                      <label key={w.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer text-slate-800 text-[11px]">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRecipientIds([...selectedRecipientIds, w.id]);
                            } else {
                              setSelectedRecipientIds(selectedRecipientIds.filter(id => id !== w.id));
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                        <div className="flex-1 truncate">
                          <span className="font-bold">{w.nama}</span> · {w.dusun} RT {w.rt} (NIK: {w.nik})
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateJadwalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Sahkan Jadwal & Kuota</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
