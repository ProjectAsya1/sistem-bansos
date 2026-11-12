import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Banknote, 
  ArrowUpRight, 
  MapPin, 
  TrendingUp, 
  Check, 
  XCircle,
  FileCheck2
} from 'lucide-react';
import { db } from '../services/storage';
import { UserRole } from '../types';
import { formatRupiah } from '../utils/scoring';

interface DashboardViewProps {
  userRole: UserRole;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ userRole, onNavigateTab }) => {
  const wargaList = db.getWarga();
  const usulanList = db.getUsulan();
  const programList = db.getPrograms();
  const penerimaList = db.getAllPenerima();
  const jadwalList = db.getJadwal();
  const auditLogs = db.getAuditLogs().slice(0, 6);

  // KPI Calculations
  const totalPenduduk = wargaList.length;
  
  // Penerima bansos aktif (approved usulan or confirmed recipients)
  const approvedWargaIds = new Set([
    ...usulanList.filter(u => u.status === 'DISETUJUI').map(u => u.wargaId),
    ...penerimaList.map(p => p.wargaId)
  ]);
  const totalPenerimaAktif = approvedWargaIds.size;

  // Dana tersalurkan
  let totalDanaTersalurkan = 0;
  let totalPaketBarangTersalurkan = 0;

  penerimaList.filter(p => p.status === 'SUDAH_DISALURKAN').forEach(p => {
    const prog = programList.find(pr => pr.id === p.programId);
    if (prog) {
      if (prog.jenis === 'Uang Tunai') {
        totalDanaTersalurkan += prog.nominalPerKpm;
      } else {
        totalPaketBarangTersalurkan += 1;
      }
    }
  });

  const pendingAdminCount = usulanList.filter(u => u.status === 'MENUNGGU_VERIFIKASI_ADMIN').length;
  const pendingKadesCount = usulanList.filter(u => u.status === 'MENUNGGU_PERSETUJUAN_KADES').length;

  // Bar chart data: Distribution by Program
  const programDistribution = programList.map(prog => {
    const count = penerimaList.filter(p => p.programId === prog.id).length;
    const deliveredCount = penerimaList.filter(p => p.programId === prog.id && p.status === 'SUDAH_DISALURKAN').length;
    return {
      id: prog.id,
      kode: prog.kode,
      nama: prog.nama,
      kuota: prog.kuota,
      count,
      deliveredCount
    };
  });

  // Pie/Donut chart data: Recipients per Dusun
  const dusunNames = ['Dusun Krajan', 'Dusun Sukamaju', 'Dusun Wates', 'Dusun Sumberagung'];
  const dusunColors = ['#2563eb', '#0891b2', '#059669', '#d97706'];
  const dusunStats = dusunNames.map((dusun, idx) => {
    const count = penerimaList.filter(p => p.warga.dusun === dusun).length;
    return {
      dusun,
      count,
      color: dusunColors[idx]
    };
  });
  const totalDusunRecipients = dusunStats.reduce((sum, d) => sum + d.count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500 font-medium">Dashboard Eksekutif · SIM-BANSOS DESA</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Monitoring Penyaluran Bantuan Sosial Desa Sukamaju
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {userRole === 'PETUGAS_LAPANGAN' && (
            <button
              type="button"
              onClick={() => onNavigateTab('usulan')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>+ Buat Usulan Warga Baru</span>
            </button>
          )}
          {userRole === 'ADMIN_DESA' && (
            <button
              type="button"
              onClick={() => onNavigateTab('penyaluran')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>+ Buat Jadwal Penyaluran</span>
            </button>
          )}
          {userRole === 'KEPALA_DESA' && pendingKadesCount > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('usulan')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm animate-pulse"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{pendingKadesCount} Usulan Menunggu Pengesahan Anda</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Notice Banner for Kades / Admin */}
      {userRole === 'KEPALA_DESA' && pendingKadesCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              !
            </div>
            <div>
              <span className="font-bold text-amber-900">Perhatian Pimpinan (Kepala Desa):</span>
              <p className="text-amber-800 mt-0.5">
                Terdapat <strong>{pendingKadesCount} usulan warga</strong> yang telah diverifikasi berkas oleh Kaur Kesra dan siap untuk ditelaah serta diberikan SK Penetapan (Approval Akhir).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('usulan')}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-md transition-colors shrink-0"
          >
            Buka Verifikasi
          </button>
        </div>
      )}

      {/* KPI Cards (4-column grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Penduduk */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Total Penduduk Terdata</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {totalPenduduk}
            </span>
            <span className="text-xs text-slate-500">Jiwa</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Terdaftar di 4 Dusun</span>
            <button 
              type="button" 
              onClick={() => onNavigateTab('warga')}
              className="text-blue-600 hover:underline flex items-center gap-0.5"
            >
              Lihat Master <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* KPI 2: Penerima Aktif */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Penerima Bansos Aktif (KPM)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {totalPenerimaAktif}
            </span>
            <span className="text-xs text-emerald-700 font-medium">Keluarga Penerima</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Status disetujui sah</span>
            <span className="text-slate-400 font-mono">
              {((totalPenerimaAktif / Math.max(1, totalPenduduk)) * 100).toFixed(0)}% cakupan
            </span>
          </div>
        </div>

        {/* KPI 3: Dana & Paket Tersalurkan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Total Dana & Logistik</span>
            <Banknote className="w-4 h-4 text-amber-600" />
          </div>
          <div className="space-y-0.5">
            <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              {formatRupiah(totalDanaTersalurkan)}
            </div>
            <div className="text-xs text-slate-600 font-medium">
              + {totalPaketBarangTersalurkan} Paket Sembako / Beras
            </div>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>Realisasi Penyaluran</span>
            <span className="text-emerald-700 font-semibold">Tercatat Sah</span>
          </div>
        </div>

        {/* KPI 4: Menunggu Verifikasi */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Menunggu Verifikasi</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {pendingAdminCount + pendingKadesCount}
            </span>
            <span className="text-xs text-slate-500">Berkas</span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>{pendingAdminCount} Admin · {pendingKadesCount} Kades</span>
            <button 
              type="button" 
              onClick={() => onNavigateTab('usulan')}
              className="text-blue-600 hover:underline flex items-center gap-0.5"
            >
              Proses <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Visualizations Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bar Chart - Distribusi per Program */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Alokasi Penerima Bantuan Berdasarkan Program (Bansos)
              </h2>
              <p className="text-xs text-slate-500">
                Perbandingan kuota program dan realisasi serah terima bantuan di lapangan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('program')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Master Program →
            </button>
          </div>

          <div className="space-y-4 pt-1">
            {programDistribution.map(item => {
              const maxVal = Math.max(1, item.kuota);
              const targetPct = Math.min(100, (item.count / maxVal) * 100);
              const deliveredPct = Math.min(100, (item.deliveredCount / maxVal) * 100);

              return (
                <div key={item.id} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">{item.nama}</span>
                      <span className="text-[11px] text-slate-400 font-mono ml-2">({item.kode})</span>
                    </div>
                    <div className="font-mono text-slate-600 tabular-nums">
                      <span className="text-emerald-700 font-bold">{item.deliveredCount} tersalurkan</span> / {item.count} terdaftar (Kuota: {item.kuota})
                    </div>
                  </div>

                  {/* Dual bar: Total vs Delivered */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex relative">
                    <div
                      style={{ width: `${targetPct}%` }}
                      className="h-full bg-blue-300 rounded-l-full"
                      title={`Terdaftar: ${item.count}`}
                    />
                    <div
                      style={{ width: `${deliveredPct}%` }}
                      className="h-full bg-blue-700 absolute left-0 top-0 rounded-l-full transition-all"
                      title={`Tersalurkan: ${item.deliveredCount}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Realisasi Penyaluran: {((item.deliveredCount / Math.max(1, item.count)) * 100).toFixed(0)}%</span>
                    <span>Sisa Kuota: {item.kuota - item.count} KPM</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Pie/Donut Chart - Sebaran per Dusun */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Sebaran Penerima per Dusun / RW
            </h2>
            <p className="text-xs text-slate-500">
              Pemerataan bantuan sosial di wilayah desa.
            </p>
          </div>

          {/* SVG Pie Chart Illustration */}
          <div className="flex items-center justify-center py-2">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let accumulatedPercent = 0;
                  return dusunStats.map((item, idx) => {
                    const percent = (item.count / totalDusunRecipients) * 100;
                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += percent;

                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth="18"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        pathLength="100"
                        className="transition-all hover:opacity-85"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-lg font-bold font-mono text-slate-900 leading-none tabular-nums">
                  {penerimaList.length}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">KPM Terdata</span>
              </div>
            </div>
          </div>

          {/* Dusun Legend list */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            {dusunStats.map((item, idx) => {
              const pct = ((item.count / totalDusunRecipients) * 100).toFixed(0);
              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="text-slate-700">{item.dusun}</span>
                  </div>
                  <span className="font-mono text-slate-900 font-semibold tabular-nums">
                    {item.count} KPM ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity Log & Delivery Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Aktivitas Penyaluran & Verifikasi Terkini
            </h2>
            <p className="text-xs text-slate-500">
              Audit trail berkas dan bukti serah terima bansos secara real-time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('audit')}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Lihat Semua Log Audit →
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {auditLogs.length > 0 ? (
            auditLogs.map(log => (
              <div key={log.id} className="p-3.5 sm:px-5 hover:bg-slate-50 flex items-start justify-between gap-4 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action === 'APPROVE' ? 'bg-emerald-100 text-emerald-800' :
                      log.action === 'VERIFY' ? 'bg-blue-100 text-blue-800' :
                      log.action === 'DISTRIBUTE' ? 'bg-amber-100 text-amber-800' :
                      log.action === 'IMPORT' ? 'bg-purple-100 text-purple-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-900">{log.userName}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 font-mono text-[11px]">{log.entity}</span>
                  </div>
                  <p className="text-slate-700">{log.details}</p>
                </div>
                <div className="text-[11px] font-mono text-slate-400 whitespace-nowrap shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-400">Belum ada riwayat aktivitas.</div>
          )}
        </div>
      </div>
    </div>
  );
};
