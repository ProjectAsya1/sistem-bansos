import React, { useState } from 'react';
import { db } from '../services/storage';
import { Search, ShieldAlert, CheckCircle2, AlertCircle, Building2, UserCheck, HelpCircle } from 'lucide-react';

interface LandingPublicCheckProps {
  onLoginClick: () => void;
  onOpenGuide: () => void;
}

export const LandingPublicCheck: React.FC<LandingPublicCheckProps> = ({ onLoginClick, onOpenGuide }) => {
  const [nikInput, setNikInput] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const clean = nikInput.trim();

    if (!clean) {
      setErrorMsg('Silakan masukkan 16 digit NIK Anda.');
      return;
    }

    if (!/^\d{16}$/.test(clean)) {
      setErrorMsg('NIK harus terdiri tepat dari 16 digit angka sesuai KTP.');
      return;
    }

    const result = db.checkNikPublic(clean);
    setSearchResult(result);
    setHasSearched(true);
  };

  const handleQuickFill = (nik: string) => {
    setNikInput(nik);
    setErrorMsg('');
    const result = db.checkNikPublic(nik);
    setSearchResult(result);
    setHasSearched(true);
  };

  return (
    <div className="space-y-10 py-6 max-w-4xl mx-auto px-4">
      {/* Official Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-full">
          <Building2 className="w-3.5 h-3.5" />
          <span>Pemerintah Desa Sukamaju · Kabupaten Malang</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 text-balance">
          Sistem Informasi Pendataan & Monitoring Penerima Bantuan Sosial Desa
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl mx-auto">
          Cek status kelayakan dan penyaluran bantuan sosial (BLT-DD, PKH, BPNT, dan Cadangan Pangan) secara transparan, akuntabel, dan mandiri.
        </p>
      </div>

      {/* Public Search Box Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            Pencarian Status Penerima Bantuan (Khusus Warga)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Masukkan 16 digit Nomor Induk Kependudukan (NIK) yang tertera pada Kartu Tanda Penduduk (KTP) atau Kartu Keluarga (KK).
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                maxLength={16}
                value={nikInput}
                onChange={(e) => {
                  setNikInput(e.target.value.replace(/\D/g, ''));
                  setErrorMsg('');
                }}
                placeholder="Contoh: 3507114502540001 (16 Digit Angka)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
              <span className="absolute right-3 top-3.5 text-xs text-slate-400 font-mono">
                {nikInput.length}/16
              </span>
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              <span>Cek Status Bansos</span>
            </button>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </form>

        {/* Quick Demo NIK Helper for testers */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="text-slate-600 font-medium">Contoh NIK Warga Terdata:</span>
          <button
            type="button"
            onClick={() => handleQuickFill('3507114502540001')}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-blue-700 font-mono text-[11px] transition-colors"
          >
            3507114502540001 (Mbah Suparmi - BLT)
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('3507111208720003')}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-blue-700 font-mono text-[11px] transition-colors"
          >
            3507111208720003 (Slamet - BLT)
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('3507116003680002')}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-blue-700 font-mono text-[11px] transition-colors"
          >
            3507116003680002 (Aminah - Proses)
          </button>
        </div>

        {/* Search Results Display */}
        {hasSearched && searchResult && (
          <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
            {searchResult.found ? (
              <div className="space-y-4 bg-emerald-50/70 border border-emerald-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Data Ditemukan dalam Basis Data Desa
                      </h3>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Nama: <span className="font-semibold text-slate-900">{searchResult.namaMasked}</span> · Wilayah: <span className="font-semibold text-slate-900">{searchResult.dusun}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                    NIK: {searchResult.nikMasked}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-emerald-200/60">
                  <div className="text-xs font-semibold text-slate-800">
                    Riwayat Kepesertaan & Status Penyaluran:
                  </div>
                  {searchResult.bantuanList && searchResult.bantuanList.length > 0 ? (
                    <div className="space-y-2">
                      {searchResult.bantuanList.map((item: any, idx: number) => (
                        <div key={idx} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{item.program}</span>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              item.status === 'Tersalurkan' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : item.status === 'Gagal Disalurkan'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="text-slate-600 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                            <span>Periode: <strong className="text-slate-800">{item.periode}</strong></span>
                            <span>Bentuk: <strong className="text-slate-800">{item.nominal}</strong></span>
                            <span>Jadwal/Tanggal: <strong className="text-slate-800">{item.waktuPencairan}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 bg-white p-3 rounded border border-slate-200">
                      Warga terdaftar dalam basis kependudukan namun belum dialokasikan pada program bantuan aktif saat ini.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-amber-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">NIK Tidak Ditemukan</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {searchResult.message || 'NIK tidak terdaftar dalam penerima bantuan sosial periode ini. Silakan hubungi Ketua RT/RW setempat untuk mengajukan usulan warga pra-sejahtera.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Public Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
          <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">01. Verifikasi Berlapis</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Setiap usulan warga diverifikasi secara fisik oleh Tim Kesra dan disahkan melalui Keputusan Kepala Desa dengan kriteria transparansi.
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
          <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">02. Bebas Bantuan Ganda</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sistem secara otomatis memvalidasi NIK agar penerima BLT-DD tidak tumpang tindih dengan penerima PKH/BPNT kementerian.
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
          <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">03. Bukti Digital Sah</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Serah terima bantuan langsung di lapangan terdokumentasi foto KPM dan tanda tangan digital untuk mencegah pemotongan atau salah sasaran.
          </p>
        </div>
      </div>

      {/* Officer Entry Callout */}
      <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Akses Portal Perangkat Desa & Petugas RT/RW</h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Kelola master data warga, input usulan baru, verifikasi kelayakan, dan jadwalkan penyaluran.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenGuide}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Dokumentasi DB</span>
          </button>
          <button
            type="button"
            onClick={onLoginClick}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Masuk Petugas Desa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
