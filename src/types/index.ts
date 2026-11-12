export type UserRole = 'ADMIN_DESA' | 'KEPALA_DESA' | 'PETUGAS_LAPANGAN';

export interface User {
  id: string;
  username: string;
  nama: string;
  role: UserRole;
  jabatan: string;
  wilayahTugas?: string;
  email: string;
  telepon: string;
  avatar?: string;
}

export type JenisKelamin = 'L' | 'P';
export type StatusRumah = 'Milik Sendiri' | 'Menumpang' | 'Sewa' | 'Bukan Milik Sendiri';
export type KondisiLantai = 'Tanah' | 'Semen Kasar' | 'Keramik Rusak' | 'Keramik Baik';
export type KondisiDinding = 'Bambu / Gedek' | 'Papan Kayu' | 'Tembok Tanpa Plester' | 'Tembok Diplester';
export type KondisiAtap = 'Rumbia / Ijuk' | 'Seng Berkarat' | 'Genteng Tanah' | 'Genteng Baik';
export type DayaListrik = 'Non-PLN / 450 VA' | '900 VA' | '1300 VA+';

export interface Warga {
  id: string;
  nik: string; // 16 digit angka
  noKk: string; // 16 digit angka
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: JenisKelamin;
  alamat: string;
  dusun: string;
  rt: string;
  rw: string;
  pekerjaan: string;
  penghasilan: number; // Rp
  jumlahTanggungan: number;
  statusRumah: StatusRumah;
  kondisiLantai: KondisiLantai;
  kondisiDinding: KondisiDinding;
  kondisiAtap: KondisiAtap;
  dayaListrik: DayaListrik;
  lansiaDisabilitas: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type KategoriKelayakan = 'SANGAT_LAYAK' | 'LAYAK' | 'TIDAK_LAYAK';
export type StatusUsulan = 
  | 'MENUNGGU_VERIFIKASI_ADMIN' 
  | 'MENUNGGU_PERSETUJUAN_KADES' 
  | 'DISETUJUI' 
  | 'DITOLAK';

export interface RincianSkor {
  penghasilanScore: number; // max 35
  perumahanScore: number;   // max 30
  tanggunganScore: number;  // max 20
  kerentananScore: number;  // max 15
  total: number;            // 0 - 100
}

export interface UsulanBansos {
  id: string;
  wargaId: string;
  warga: Warga;
  fotoKtp?: string;
  fotoKk?: string;
  fotoRumahDepan?: string;
  fotoRumahDalam?: string;
  catatanPetugas: string;
  pengusulId: string;
  pengusulNama: string;
  pengusulRole: string;
  skorKelayakan: number;
  kategoriKelayakan: KategoriKelayakan;
  rincianSkor: RincianSkor;
  status: StatusUsulan;
  rekomendasiProgramId?: string;
  catatanAdmin?: string;
  diverifikasiOleh?: string;
  tanggalVerifikasi?: string;
  catatanKades?: string;
  disetujuiOleh?: string;
  tanggalPersetujuan?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProgramBansos {
  id: string;
  kode: string;
  nama: string;
  sumberDana: 'Dana Desa (APBDes)' | 'Kementerian Sosial RI (APBN)' | 'Pemerintah Provinsi' | 'Pemerintah Kabupaten';
  periode: string;
  tahun: number;
  jenis: 'Uang Tunai' | 'Barang / Sembako';
  nominalPerKpm: number;
  keteranganBarang?: string;
  kuota: number;
  kriteriaEksklusif: boolean; // Tidak boleh double dengan program tertentu
  status: 'AKTIF' | 'SELESAI' | 'DRAF';
  keterangan: string;
  createdAt: string;
}

export type StatusPenyaluranJadwal = 'TERJADWAL' | 'BERLANGSUNG' | 'SELESAI';

export interface PenyaluranJadwal {
  id: string;
  programId: string;
  programNama: string;
  judul: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  petugasPenanggungJawab: string;
  kontakPetugas: string;
  totalSasaran: number;
  totalTersalurkan: number;
  status: StatusPenyaluranJadwal;
  catatan?: string;
  createdAt: string;
}

export type StatusPenerimaPenyaluran = 'BELUM_DISALURKAN' | 'SUDAH_DISALURKAN' | 'GAGAL_DISALURKAN';

export interface PenerimaPenyaluran {
  id: string;
  jadwalId: string;
  programId: string;
  programNama: string;
  wargaId: string;
  warga: Warga;
  status: StatusPenerimaPenyaluran;
  alasanGagal?: string;
  waktuSerahTerima?: string;
  petugasPenyalur?: string;
  namaPenerimaNyata?: string;
  hubunganDenganKpm?: 'Yang Bersangkutan' | 'Suami/Istri' | 'Anak' | 'Anggota Keluarga Lain';
  fotoBukti?: string;
  tandaTangan?: string; // Base64 data URL
  catatan?: string;
}

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'VERIFY' 
  | 'APPROVE' 
  | 'REJECT' 
  | 'DISTRIBUTE' 
  | 'IMPORT' 
  | 'EXPORT';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  entity: 'WARGA' | 'USULAN' | 'PROGRAM' | 'PENYALURAN' | 'USER' | 'SISTEM';
  entityId: string;
  details: string;
  timestamp: string;
}
