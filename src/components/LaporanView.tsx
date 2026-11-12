import React, { useState } from 'react';
import { db } from '../services/storage';
import { PenerimaPenyaluran, ProgramBansos, UserRole } from '../types';
import { formatRupiah, maskNik } from '../utils/scoring';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  Building2, 
  CheckCircle2, 
  Calendar,
  Layers,
  MapPin
} from 'lucide-react';

interface LaporanViewProps {
  userRole: UserRole;
}

export const LaporanView: React.FC<LaporanViewProps> = ({ userRole }) => {
  const [allPenerima] = useState<PenerimaPenyaluran[]>(db.getAllPenerima());
  const [programs] = useState<ProgramBansos[]>(db.getPrograms());

  // Filters
  const [selectedProgramId, setSelectedProgramId] = useState<string>('ALL');
  const [selectedDusun, setSelectedDusun] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Filtered rows
  const filtered = allPenerima.filter(item => {
    const matchProg = selectedProgramId === 'ALL' || item.programId === selectedProgramId;
    const matchDusun = selectedDusun === 'ALL' || item.warga.dusun === selectedDusun;
    const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
    return matchProg && matchDusun && matchStatus;
  });

  const activeProgObj = programs.find(p => p.id === selectedProgramId);
  const activeProgName = activeProgObj ? activeProgObj.nama : 'Semua Program Bansos';

  const handleExportExcel = () => {
    db.exportLaporanToExcel(filtered, activeProgName);
  };

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Header bar (no-print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 no-print">
        <div>
          <div className="text-xs text-slate-500 font-medium">Pelaporan & Arsip Resmi Desa</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Rekapitulasi Laporan & Cetak Berita Acara (PDF)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ekspor data mentah ke Excel atau cetak dokumen resmi ber-Kop Surat Pemerintah Desa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen Resmi (PDF)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (no-print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-4 text-xs no-print">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter Laporan:</span>
        </div>

        {/* Program Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Program:</span>
          <select
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
          >
            <option value="ALL">Semua Program Bansos</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.nama} ({p.kode})</option>
            ))}
          </select>
        </div>

        {/* Dusun Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Dusun:</span>
          <select
            value={selectedDusun}
            onChange={(e) => setSelectedDusun(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
          >
            <option value="ALL">Semua Dusun</option>
            <option value="Dusun Krajan">Dusun Krajan</option>
            <option value="Dusun Sukamaju">Dusun Sukamaju</option>
            <option value="Dusun Wates">Dusun Wates</option>
            <option value="Dusun Sumberagung">Dusun Sumberagung</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Status Penyaluran:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
          >
            <option value="ALL">Semua Status</option>
            <option value="SUDAH_DISALURKAN">Sudah Disalurkan</option>
            <option value="BELUM_DISALURKAN">Belum Disalurkan</option>
            <option value="GAGAL_DISALURKAN">Gagal Disalurkan</option>
          </select>
        </div>

        <div className="text-slate-400 font-mono ml-auto">
          Ditemukan: <strong className="text-slate-800">{filtered.length}</strong> KPM
        </div>
      </div>

      {/* OFFICIAL PRINTABLE DOCUMENT WITH VILLAGE LETTERHEAD (KOP SURAT DESA) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 sm:p-10 text-slate-900 print:border-none print:shadow-none print:p-0">
        
        {/* KOP SURAT PEMERINTAH DESA RESMI */}
        <div className="text-center pb-4 relative">
          {/* Logo Garuda / Lambang Daerah Simulator */}
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-full border-2 border-slate-900 flex items-center justify-center font-bold text-slate-900 text-xl font-serif">
              🏛️
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-800">
                Pemerintah Kabupaten Malang · Kecamatan Kepanjen
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-slate-950 font-serif">
                Pemerintah Desa Sukamaju
              </h2>
              <div className="text-[11px] text-slate-600">
                Jalan Raya Sukamaju No. 01 Kode Pos 65163 · Email: pemdes@sukamaju.desa.id · Telepon: (0341) 390123
              </div>
            </div>
          </div>

          {/* Double line border for official Indonesian Kop Surat */}
          <div className="border-t-2 border-b border-slate-900 h-1 my-3" />
        </div>

        {/* Document Title & Reference Number */}
        <div className="text-center my-4 space-y-1">
          <h3 className="text-sm font-bold uppercase underline tracking-wider font-serif">
            Berita Acara Penyaluran & Rekapitulasi Bantuan Sosial Desa
          </h3>
          <div className="text-[11px] font-mono text-slate-600">
            Nomor: 460 / {new Date().getFullYear()} / BA-BANSOS / SKMJ / {new Date().getMonth() + 1}
          </div>
        </div>

        {/* Preamble */}
        <p className="text-xs text-slate-700 leading-relaxed text-justify mb-4">
          Pada hari ini, bertempat di Balai Desa Sukamaju Kecamatan Kepanjen Kabupaten Malang, telah dilaksanakan verifikasi dan penyaluran bantuan sosial <strong>{activeProgName}</strong> kepada Keluarga Penerima Manfaat (KPM) sesuai ketentuan perundang-undangan dan Keputusan Kepala Desa Sukamaju, dengan rincian data sebagai berikut:
        </p>

        {/* Printable Data Table */}
        <div className="overflow-x-auto border border-slate-300 rounded mb-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                <th className="py-2.5 px-3 border-r border-slate-300 text-center w-10">No</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Nama KPM</th>
                <th className="py-2.5 px-3 border-r border-slate-300">NIK (16 Digit)</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Dusun / RT / RW</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Program Bantuan</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Tanda Tangan / Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length > 0 ? (
                filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center font-mono border-r border-slate-200 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200">
                      {item.warga.nama}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 border-r border-slate-200">
                      {item.warga.nik}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 border-r border-slate-200">
                      {item.warga.dusun} (RT {item.warga.rt} / RW {item.warga.rw})
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 border-r border-slate-200">
                      {item.programNama}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'SUDAH_DISALURKAN' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'GAGAL_DISALURKAN' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {item.tandaTangan ? (
                        <div className="h-8 flex items-center justify-center">
                          <img src={item.tandaTangan} alt="TTD" className="h-7 object-contain" />
                        </div>
                      ) : (
                        <div className="h-8 border-b border-dashed border-slate-300 flex items-end justify-center text-[10px] text-slate-400">
                          {item.status === 'SUDAH_DISALURKAN' ? '(Sah)' : '(Belum Disalurkan)'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada data penyaluran pada filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Official Signatures Grid (Tanda Tangan Pelaksana & Kepala Desa) */}
        <div className="pt-6 border-t border-slate-200 print-break-inside-avoid">
          <div className="grid grid-cols-2 text-center text-xs text-slate-800">
            {/* Pelaksana / Kesra */}
            <div className="space-y-16">
              <div>
                <div>Mengetahui / Memeriksa,</div>
                <div className="font-bold">Kaur Kesejahteraan Rakyat (Kesra)</div>
              </div>
              <div>
                <div className="font-bold underline">BUDI HARTONO, S.AP</div>
                <div className="text-[11px] text-slate-500 font-mono">NIPD. 19820514 200801 1 004</div>
              </div>
            </div>

            {/* Kepala Desa */}
            <div className="space-y-16">
              <div>
                <div>Sukamaju, {todayStr}</div>
                <div className="font-bold">Kepala Desa Sukamaju</div>
              </div>
              <div>
                <div className="font-bold underline">H. AHMAD SURYANTO, S.Sos</div>
                <div className="text-[11px] text-slate-500 font-mono">NIPD. 19740920 199903 1 002</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
