import * as XLSX from 'xlsx';
import { 
  User, 
  Warga, 
  ProgramBansos, 
  PenyaluranJadwal, 
  PenerimaPenyaluran, 
  UsulanBansos, 
  AuditLog, 
  StatusUsulan,
  UserRole,
  AuditAction
} from '../types';
import { 
  SEED_USERS, 
  SEED_WARGA, 
  SEED_PROGRAMS, 
  SEED_USULAN, 
  SEED_JADWAL, 
  SEED_PENERIMA_PENYALURAN, 
  SEED_AUDIT_LOGS 
} from '../data/seedData';
import { hitungSkorKelayakan } from '../utils/scoring';

const STORAGE_KEYS = {
  USERS: 'simbansos_users',
  WARGA: 'simbansos_warga',
  PROGRAMS: 'simbansos_programs',
  USULAN: 'simbansos_usulan',
  JADWAL: 'simbansos_jadwal',
  PENERIMA: 'simbansos_penerima',
  AUDIT: 'simbansos_audit_logs',
  SESSION: 'simbansos_active_session'
};

class DataStore {
  private users: User[] = [];
  private warga: Warga[] = [];
  private programs: ProgramBansos[] = [];
  private usulan: UsulanBansos[] = [];
  private jadwal: PenyaluranJadwal[] = [];
  private penerima: PenerimaPenyaluran[] = [];
  private auditLogs: AuditLog[] = [];
  private activeUser: User | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      this.users = storedUsers ? JSON.parse(storedUsers) : [...SEED_USERS];

      const storedWarga = localStorage.getItem(STORAGE_KEYS.WARGA);
      this.warga = storedWarga ? JSON.parse(storedWarga) : [...SEED_WARGA];

      const storedPrograms = localStorage.getItem(STORAGE_KEYS.PROGRAMS);
      this.programs = storedPrograms ? JSON.parse(storedPrograms) : [...SEED_PROGRAMS];

      const storedUsulan = localStorage.getItem(STORAGE_KEYS.USULAN);
      this.usulan = storedUsulan ? JSON.parse(storedUsulan) : [...SEED_USULAN];

      const storedJadwal = localStorage.getItem(STORAGE_KEYS.JADWAL);
      this.jadwal = storedJadwal ? JSON.parse(storedJadwal) : [...SEED_JADWAL];

      const storedPenerima = localStorage.getItem(STORAGE_KEYS.PENERIMA);
      this.penerima = storedPenerima ? JSON.parse(storedPenerima) : [...SEED_PENERIMA_PENYALURAN];

      const storedAudit = localStorage.getItem(STORAGE_KEYS.AUDIT);
      this.auditLogs = storedAudit ? JSON.parse(storedAudit) : [...SEED_AUDIT_LOGS];

      const storedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
      this.activeUser = storedSession ? JSON.parse(storedSession) : null;
    } catch (e) {
      console.error('Error loading localStorage, falling back to seed data:', e);
      this.resetToSeedData();
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public resetToSeedData() {
    this.users = [...SEED_USERS];
    this.warga = [...SEED_WARGA];
    this.programs = [...SEED_PROGRAMS];
    this.usulan = [...SEED_USULAN];
    this.jadwal = [...SEED_JADWAL];
    this.penerima = [...SEED_PENERIMA_PENYALURAN];
    this.auditLogs = [...SEED_AUDIT_LOGS];
    this.saveAll();
    this.notify();
  }

  private saveAll() {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEYS.WARGA, JSON.stringify(this.warga));
      localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(this.programs));
      localStorage.setItem(STORAGE_KEYS.USULAN, JSON.stringify(this.usulan));
      localStorage.setItem(STORAGE_KEYS.JADWAL, JSON.stringify(this.jadwal));
      localStorage.setItem(STORAGE_KEYS.PENERIMA, JSON.stringify(this.penerima));
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(this.auditLogs));
      if (this.activeUser) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(this.activeUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    } catch (err) {
      console.error('Failed to persist to localStorage', err);
    }
  }

  // --- AUDIT TRAIL ---
  public logAudit(action: AuditAction, entity: 'WARGA' | 'USULAN' | 'PROGRAM' | 'PENYALURAN' | 'USER' | 'SISTEM', entityId: string, details: string) {
    const user = this.activeUser || {
      id: 'system',
      nama: 'Sistem SIM-BANSOS',
      role: 'ADMIN_DESA' as UserRole
    };

    const newLog: AuditLog = {
      id: 'aud-' + Date.now(),
      userId: user.id,
      userName: user.nama,
      userRole: user.role as UserRole,
      action,
      entity,
      entityId,
      details,
      timestamp: new Date().toISOString()
    };

    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
    this.saveAll();
    this.notify();
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  // --- AUTHENTICATION ---
  public getActiveUser(): User | null {
    return this.activeUser;
  }

  public login(username: string, password: string, selectedRole?: UserRole): { success: boolean; message?: string; user?: User } {
    const normalizedUser = username.trim().toLowerCase();
    
    // Check credentials (standard default password for demo: password123, or matching username)
    const user = this.users.find(u => 
      (u.username.toLowerCase() === normalizedUser || u.email.toLowerCase() === normalizedUser)
    );

    if (!user) {
      return { success: false, message: 'Username atau email tidak terdaftar dalam sistem.' };
    }

    if (password !== 'password123' && password !== 'admin' && password !== 'desa123') {
      return { success: false, message: 'Kata sandi tidak sesuai. Silakan coba kembali.' };
    }

    if (selectedRole && user.role !== selectedRole) {
      return { success: false, message: `Akun ini tidak memiliki hak akses role ${selectedRole}. Silakan pilih role yang sesuai.` };
    }

    this.activeUser = user;
    this.saveAll();
    this.logAudit('VERIFY', 'USER', user.id, `Pengguna ${user.nama} (${user.role}) berhasil masuk ke sistem.`);
    this.notify();
    return { success: true, user };
  }

  public logout() {
    if (this.activeUser) {
      this.logAudit('VERIFY', 'USER', this.activeUser.id, `Pengguna ${this.activeUser.nama} keluar dari sistem.`);
    }
    this.activeUser = null;
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    this.notify();
  }

  public getUsers(): User[] {
    return [...this.users];
  }

  public addUser(userData: Omit<User, 'id'>): { success: boolean; message?: string; user?: User } {
    const exists = this.users.some(u => u.username.toLowerCase() === userData.username.toLowerCase());
    if (exists) {
      return { success: false, message: 'Username sudah digunakan oleh akun lain.' };
    }
    const newUser: User = {
      ...userData,
      id: 'usr-' + Date.now()
    };
    this.users.push(newUser);
    this.saveAll();
    this.logAudit('CREATE', 'USER', newUser.id, `Menambahkan akun pengguna baru: ${newUser.nama} (${newUser.role})`);
    this.notify();
    return { success: true, user: newUser };
  }

  public deleteUser(userId: string): { success: boolean; message?: string } {
    if (this.activeUser?.id === userId) {
      return { success: false, message: 'Tidak dapat menghapus akun yang sedang aktif digunakan.' };
    }
    const target = this.users.find(u => u.id === userId);
    this.users = this.users.filter(u => u.id !== userId);
    this.saveAll();
    if (target) {
      this.logAudit('DELETE', 'USER', userId, `Menghapus akun petugas: ${target.nama}`);
    }
    this.notify();
    return { success: true };
  }

  // --- WARGA (MASTER DATA PENDUDUK) ---
  public getWarga(): Warga[] {
    return [...this.warga];
  }

  public getWargaById(id: string): Warga | undefined {
    return this.warga.find(w => w.id === id);
  }

  public findWargaByNik(nik: string): Warga | undefined {
    const cleanNik = nik.trim();
    return this.warga.find(w => w.nik === cleanNik);
  }

  public validateNik(nik: string, excludeId?: string): { valid: boolean; message?: string } {
    const clean = nik.trim();
    if (!/^\d{16}$/.test(clean)) {
      return { valid: false, message: 'NIK wajib terdiri tepat dari 16 digit angka.' };
    }
    const duplicate = this.warga.find(w => w.nik === clean && w.id !== excludeId);
    if (duplicate) {
      return { valid: false, message: `NIK ${clean} sudah terdaftar atas nama warga: ${duplicate.nama}. NIK harus unik.` };
    }
    return { valid: true };
  }

  public addWarga(data: Omit<Warga, 'id' | 'createdAt'>): { success: boolean; message?: string; warga?: Warga } {
    const val = this.validateNik(data.nik);
    if (!val.valid) {
      return { success: false, message: val.message };
    }

    const newWarga: Warga = {
      ...data,
      id: 'warga-' + Date.now(),
      createdAt: new Date().toISOString()
    };

    this.warga.unshift(newWarga);
    this.saveAll();
    this.logAudit('CREATE', 'WARGA', newWarga.id, `Mendaftarkan warga baru: ${newWarga.nama} (NIK: ${newWarga.nik})`);
    this.notify();
    return { success: true, warga: newWarga };
  }

  public updateWarga(id: string, data: Partial<Warga>): { success: boolean; message?: string; warga?: Warga } {
    const index = this.warga.findIndex(w => w.id === id);
    if (index === -1) {
      return { success: false, message: 'Data warga tidak ditemukan.' };
    }

    if (data.nik) {
      const val = this.validateNik(data.nik, id);
      if (!val.valid) {
        return { success: false, message: val.message };
      }
    }

    const updated: Warga = {
      ...this.warga[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.warga[index] = updated;

    // Update synced warga inside usulan and penerima records
    this.usulan = this.usulan.map(u => u.wargaId === id ? { ...u, warga: updated } : u);
    this.penerima = this.penerima.map(p => p.wargaId === id ? { ...p, warga: updated } : p);

    this.saveAll();
    this.logAudit('UPDATE', 'WARGA', id, `Memperbarui data kependudukan warga: ${updated.nama}`);
    this.notify();
    return { success: true, warga: updated };
  }

  public deleteWarga(id: string): { success: boolean; message?: string } {
    const target = this.warga.find(w => w.id === id);
    if (!target) {
      return { success: false, message: 'Data warga tidak ditemukan.' };
    }

    // Check if resident is active in distributions
    const inDist = this.penerima.some(p => p.wargaId === id && p.status === 'SUDAH_DISALURKAN');
    if (inDist) {
      return { success: false, message: 'Warga tidak dapat dihapus karena sudah memiliki riwayat penyaluran bansos aktif.' };
    }

    this.warga = this.warga.filter(w => w.id !== id);
    this.usulan = this.usulan.filter(u => u.wargaId !== id);
    this.penerima = this.penerima.filter(p => p.wargaId !== id);
    this.saveAll();
    this.logAudit('DELETE', 'WARGA', id, `Menghapus data kependudukan warga: ${target.nama} (NIK: ${target.nik})`);
    this.notify();
    return { success: true };
  }

  // --- BULK EXCEL / CSV IMPORT & EXPORT ---
  public importWargaFromExcel(file: File): Promise<{ success: boolean; importedCount: number; errors: string[] }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet);

          if (!rawRows || rawRows.length === 0) {
            resolve({ success: false, importedCount: 0, errors: ['File Excel/CSV tidak memiliki baris data.'] });
            return;
          }

          let imported = 0;
          const errors: string[] = [];

          for (let i = 0; i < rawRows.length; i++) {
            const row = rawRows[i];
            const rowNum = i + 2; // header at 1
            const nikStr = String(row['NIK'] || row['nik'] || '').trim();
            const namaStr = String(row['Nama'] || row['Nama Lengkap'] || row['nama'] || '').trim();

            if (!nikStr || !/^\d{16}$/.test(nikStr)) {
              errors.push(`Baris ${rowNum}: NIK "${nikStr}" tidak valid (harus tepat 16 digit angka).`);
              continue;
            }

            if (!namaStr) {
              errors.push(`Baris ${rowNum}: Nama warga tidak boleh kosong.`);
              continue;
            }

            if (this.warga.some(w => w.nik === nikStr)) {
              errors.push(`Baris ${rowNum}: NIK ${nikStr} (${namaStr}) sudah ada di database (duplikat).`);
              continue;
            }

            const noKk = String(row['No KK'] || row['NO KK'] || row['noKk'] || '3507110000000000').trim();
            const dusun = String(row['Dusun'] || row['dusun'] || 'Dusun Krajan').trim();
            const rt = String(row['RT'] || row['rt'] || '001').padStart(3, '0');
            const rw = String(row['RW'] || row['rw'] || '001').padStart(3, '0');
            const penghasilan = Number(row['Penghasilan'] || row['penghasilan'] || 750000);
            const tanggungan = Number(row['Tanggungan'] || row['tanggungan'] || 2);
            const pekerjaan = String(row['Pekerjaan'] || row['pekerjaan'] || 'Buruh Tani');
            const lansia = String(row['Lansia/Disabilitas'] || row['lansiaDisabilitas'] || '').toLowerCase() === 'ya' || row['lansiaDisabilitas'] === true;

            const newResident: Warga = {
              id: 'warga-' + (Date.now() + i),
              nik: nikStr,
              noKk: noKk,
              nama: namaStr,
              tempatLahir: String(row['Tempat Lahir'] || 'Malang'),
              tanggalLahir: String(row['Tanggal Lahir'] || '1980-01-01'),
              jenisKelamin: String(row['Jenis Kelamin'] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L',
              alamat: String(row['Alamat'] || `RT ${rt} / RW ${rw}`),
              dusun,
              rt,
              rw,
              pekerjaan,
              penghasilan: isNaN(penghasilan) ? 800000 : penghasilan,
              jumlahTanggungan: isNaN(tanggungan) ? 2 : tanggungan,
              statusRumah: (row['Status Rumah'] || 'Milik Sendiri') as any,
              kondisiLantai: (row['Kondisi Lantai'] || 'Tanah') as any,
              kondisiDinding: (row['Kondisi Dinding'] || 'Bambu / Gedek') as any,
              kondisiAtap: (row['Kondisi Atap'] || 'Genteng Tanah') as any,
              dayaListrik: (row['Daya Listrik'] || 'Non-PLN / 450 VA') as any,
              lansiaDisabilitas: lansia,
              createdAt: new Date().toISOString()
            };

            this.warga.push(newResident);
            imported++;
          }

          if (imported > 0) {
            this.saveAll();
            this.logAudit('IMPORT', 'WARGA', 'mass-import', `Impor data massal berhasil menambahkan ${imported} data penduduk.`);
            this.notify();
          }

          resolve({
            success: imported > 0,
            importedCount: imported,
            errors
          });
        } catch (err: any) {
          resolve({ success: false, importedCount: 0, errors: ['Gagal membaca file: ' + err.message] });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  public exportWargaToExcel() {
    const exportData = this.warga.map((w, idx) => ({
      'No': idx + 1,
      'NIK': w.nik,
      'No KK': w.noKk,
      'Nama Lengkap': w.nama,
      'Jenis Kelamin': w.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      'Tempat Lahir': w.tempatLahir,
      'Tanggal Lahir': w.tanggalLahir,
      'Dusun': w.dusun,
      'RT': w.rt,
      'RW': w.rw,
      'Alamat': w.alamat,
      'Pekerjaan': w.pekerjaan,
      'Penghasilan (Rp)': w.penghasilan,
      'Jumlah Tanggungan': w.jumlahTanggungan,
      'Status Rumah': w.statusRumah,
      'Lantai': w.kondisiLantai,
      'Dinding': w.kondisiDinding,
      'Atap': w.kondisiAtap,
      'Listrik': w.dayaListrik,
      'Lansia / Disabilitas': w.lansiaDisabilitas ? 'Ya' : 'Tidak'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Penduduk_Desa');
    XLSX.writeFile(workbook, `Data_Penduduk_SIM_BANSOS_${new Date().toISOString().slice(0, 10)}.xlsx`);
    this.logAudit('EXPORT', 'WARGA', 'export-excel', 'Mengekspor seluruh master data kependudukan ke file Excel');
  }

  // --- PENDATAAN & USULAN BANSOS (SCORING & APPROVAL) ---
  public getUsulan(): UsulanBansos[] {
    return [...this.usulan];
  }

  public getUsulanById(id: string): UsulanBansos | undefined {
    return this.usulan.find(u => u.id === id);
  }

  public createUsulan(params: {
    wargaId: string;
    catatanPetugas: string;
    fotoKtp?: string;
    fotoKk?: string;
    fotoRumahDepan?: string;
    fotoRumahDalam?: string;
    rekomendasiProgramId?: string;
  }): { success: boolean; message?: string; usulan?: UsulanBansos } {
    const warga = this.getWargaById(params.wargaId);
    if (!warga) {
      return { success: false, message: 'Warga tidak ditemukan.' };
    }

    // Check if already proposed in an active state
    const existing = this.usulan.find(u => 
      u.wargaId === params.wargaId && 
      (u.status === 'MENUNGGU_VERIFIKASI_ADMIN' || u.status === 'MENUNGGU_PERSETUJUAN_KADES' || u.status === 'DISETUJUI')
    );
    if (existing) {
      return { 
        success: false, 
        message: `Warga ${warga.nama} sudah memiliki usulan aktif (Status: ${existing.status}). Tidak boleh membuat usulan ganda.` 
      };
    }

    // Calculate score automatically
    const scoreResult = hitungSkorKelayakan(warga);
    const user = this.activeUser || {
      id: 'usr-3',
      nama: 'Petugas Lapangan',
      role: 'PETUGAS_LAPANGAN'
    };

    const newUsulan: UsulanBansos = {
      id: 'usul-' + Date.now(),
      wargaId: warga.id,
      warga,
      fotoKtp: params.fotoKtp,
      fotoKk: params.fotoKk,
      fotoRumahDepan: params.fotoRumahDepan,
      fotoRumahDalam: params.fotoRumahDalam,
      catatanPetugas: params.catatanPetugas,
      pengusulId: user.id,
      pengusulNama: user.nama,
      pengusulRole: user.role,
      skorKelayakan: scoreResult.skor,
      kategoriKelayakan: scoreResult.kategori,
      rincianSkor: scoreResult.rincian,
      status: 'MENUNGGU_VERIFIKASI_ADMIN',
      rekomendasiProgramId: params.rekomendasiProgramId,
      createdAt: new Date().toISOString()
    };

    this.usulan.unshift(newUsulan);
    this.saveAll();
    this.logAudit('CREATE', 'USULAN', newUsulan.id, `Petugas ${user.nama} mengajukan usulan bansos untuk ${warga.nama} dengan skor ${scoreResult.skor} (${scoreResult.kategori})`);
    this.notify();
    return { success: true, usulan: newUsulan };
  }

  public verifyUsulanAdmin(usulanId: string, catatan: string, status: 'MENUNGGU_PERSETUJUAN_KADES' | 'DITOLAK'): { success: boolean; message?: string } {
    const index = this.usulan.findIndex(u => u.id === usulanId);
    if (index === -1) {
      return { success: false, message: 'Usulan tidak ditemukan.' };
    }

    const current = this.usulan[index];
    const user = this.activeUser || { id: 'admin', nama: 'Budi Hartono (Kaur Kesra)', role: 'ADMIN_DESA' };

    this.usulan[index] = {
      ...current,
      status,
      catatanAdmin: catatan,
      diverifikasiOleh: user.nama,
      tanggalVerifikasi: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.saveAll();
    const actionLabel = status === 'MENUNGGU_PERSETUJUAN_KADES' ? 'memverifikasi berkas (diteruskan ke Kepala Desa)' : 'menolak usulan';
    this.logAudit('VERIFY', 'USULAN', usulanId, `Kaur Kesra ${user.nama} ${actionLabel} untuk KPM ${current.warga.nama}`);
    this.notify();
    return { success: true };
  }

  public approveUsulanKades(usulanId: string, catatan: string, approved: boolean): { success: boolean; message?: string } {
    const index = this.usulan.findIndex(u => u.id === usulanId);
    if (index === -1) {
      return { success: false, message: 'Usulan tidak ditemukan.' };
    }

    const current = this.usulan[index];
    const user = this.activeUser || { id: 'kades', nama: 'H. Ahmad Suryanto (Kades)', role: 'KEPALA_DESA' };
    const newStatus: StatusUsulan = approved ? 'DISETUJUI' : 'DITOLAK';

    this.usulan[index] = {
      ...current,
      status: newStatus,
      catatanKades: catatan,
      disetujuiOleh: user.nama,
      tanggalPersetujuan: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.saveAll();
    const actionLabel = approved ? 'menyetujui (Approval Akhir)' : 'menolak persetujuan';
    this.logAudit(approved ? 'APPROVE' : 'REJECT', 'USULAN', usulanId, `Kepala Desa ${user.nama} ${actionLabel} KPM ${current.warga.nama}`);
    this.notify();
    return { success: true };
  }

  // --- PROGRAM BANSOS ---
  public getPrograms(): ProgramBansos[] {
    return [...this.programs];
  }

  public addProgram(data: Omit<ProgramBansos, 'id' | 'createdAt'>): { success: boolean; program?: ProgramBansos } {
    const newProg: ProgramBansos = {
      ...data,
      id: 'prog-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    this.programs.push(newProg);
    this.saveAll();
    this.logAudit('CREATE', 'PROGRAM', newProg.id, `Membuat master program bantuan sosial: ${newProg.nama} (${newProg.kode})`);
    this.notify();
    return { success: true, program: newProg };
  }

  public updateProgram(id: string, data: Partial<ProgramBansos>): { success: boolean; message?: string } {
    const index = this.programs.findIndex(p => p.id === id);
    if (index === -1) return { success: false, message: 'Program tidak ditemukan.' };
    this.programs[index] = { ...this.programs[index], ...data };
    this.saveAll();
    this.logAudit('UPDATE', 'PROGRAM', id, `Memperbarui data program bantuan: ${this.programs[index].nama}`);
    this.notify();
    return { success: true };
  }

  // --- PENJADWALAN & PENYALURAN LAPANGAN ---
  public getJadwal(): PenyaluranJadwal[] {
    return [...this.jadwal];
  }

  public createJadwal(data: Omit<PenyaluranJadwal, 'id' | 'totalSasaran' | 'totalTersalurkan' | 'createdAt'>, wargaIds: string[]): { success: boolean; message?: string; jadwal?: PenyaluranJadwal } {
    if (wargaIds.length === 0) {
      return { success: false, message: 'Pilih minimal satu warga penerima bantuan (KPM).' };
    }

    const program = this.programs.find(p => p.id === data.programId);
    if (!program) {
      return { success: false, message: 'Program bantuan tidak valid.' };
    }

    const newJadwal: PenyaluranJadwal = {
      ...data,
      id: 'jdw-' + Date.now(),
      totalSasaran: wargaIds.length,
      totalTersalurkan: 0,
      createdAt: new Date().toISOString()
    };

    // Create recipient records
    const newPenerimaRows: PenerimaPenyaluran[] = [];
    for (const wId of wargaIds) {
      const w = this.getWargaById(wId);
      if (w) {
        newPenerimaRows.push({
          id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          jadwalId: newJadwal.id,
          programId: program.id,
          programNama: program.nama,
          wargaId: w.id,
          warga: w,
          status: 'BELUM_DISALURKAN'
        });
      }
    }

    this.jadwal.unshift(newJadwal);
    this.penerima.push(...newPenerimaRows);
    this.saveAll();
    this.logAudit('CREATE', 'PENYALURAN', newJadwal.id, `Menjadwalkan penyaluran ${program.nama} untuk ${wargaIds.length} sasaran penerima`);
    this.notify();
    return { success: true, jadwal: newJadwal };
  }

  public getPenerimaByJadwal(jadwalId: string): PenerimaPenyaluran[] {
    return this.penerima.filter(p => p.jadwalId === jadwalId);
  }

  public getAllPenerima(): PenerimaPenyaluran[] {
    return [...this.penerima];
  }

  // Confirm Handover (Serah Terima Bantuan)
  public confirmDistribusiSuccess(params: {
    penerimaId: string;
    namaPenerimaNyata: string;
    hubunganDenganKpm: 'Yang Bersangkutan' | 'Suami/Istri' | 'Anak' | 'Anggota Keluarga Lain';
    fotoBukti: string;
    tandaTangan: string;
    catatan?: string;
  }): { success: boolean; message?: string } {
    const idx = this.penerima.findIndex(p => p.id === params.penerimaId);
    if (idx === -1) {
      return { success: false, message: 'Data penerima tidak ditemukan.' };
    }

    const current = this.penerima[idx];
    const user = this.activeUser || { nama: 'Petugas Lapangan', role: 'PETUGAS_LAPANGAN' };

    this.penerima[idx] = {
      ...current,
      status: 'SUDAH_DISALURKAN',
      namaPenerimaNyata: params.namaPenerimaNyata,
      hubunganDenganKpm: params.hubunganDenganKpm,
      fotoBukti: params.fotoBukti,
      tandaTangan: params.tandaTangan,
      catatan: params.catatan,
      petugasPenyalur: user.nama,
      waktuSerahTerima: new Date().toISOString()
    };

    // Update count in jadwal
    const jIdx = this.jadwal.findIndex(j => j.id === current.jadwalId);
    if (jIdx !== -1) {
      const deliveredCount = this.penerima.filter(p => p.jadwalId === current.jadwalId && p.status === 'SUDAH_DISALURKAN').length;
      this.jadwal[jIdx].totalTersalurkan = deliveredCount;
      if (deliveredCount === this.jadwal[jIdx].totalSasaran) {
        this.jadwal[jIdx].status = 'SELESAI';
      } else {
        this.jadwal[jIdx].status = 'BERLANGSUNG';
      }
    }

    this.saveAll();
    this.logAudit('DISTRIBUTE', 'PENYALURAN', current.jadwalId, `Konfirmasi serah terima bantuan kepada ${current.warga.nama} (Diterima oleh: ${params.namaPenerimaNyata})`);
    this.notify();
    return { success: true };
  }

  // Record failed distribution (Gagal Disalurkan)
  public confirmDistribusiGagal(penerimaId: string, alasanGagal: string): { success: boolean; message?: string } {
    const idx = this.penerima.findIndex(p => p.id === penerimaId);
    if (idx === -1) {
      return { success: false, message: 'Data penerima tidak ditemukan.' };
    }

    const current = this.penerima[idx];
    const user = this.activeUser || { nama: 'Petugas Lapangan', role: 'PETUGAS_LAPANGAN' };

    this.penerima[idx] = {
      ...current,
      status: 'GAGAL_DISALURKAN',
      alasanGagal,
      petugasPenyalur: user.nama,
      waktuSerahTerima: new Date().toISOString()
    };

    this.saveAll();
    this.logAudit('DISTRIBUTE', 'PENYALURAN', current.jadwalId, `Pencatatan gagal salur untuk ${current.warga.nama}: ${alasanGagal}`);
    this.notify();
    return { success: true };
  }

  // --- REPORTING & EXPORT ---
  public exportLaporanToExcel(filteredRows: PenerimaPenyaluran[], programNama: string = 'Semua Program') {
    const data = filteredRows.map((r, index) => ({
      'No': index + 1,
      'NIK': r.warga.nik,
      'Nama KPM': r.warga.nama,
      'Dusun': r.warga.dusun,
      'RT/RW': `RT ${r.warga.rt} / RW ${r.warga.rw}`,
      'Program Bantuan': r.programNama,
      'Status Penyaluran': r.status === 'SUDAH_DISALURKAN' ? 'Tersalurkan' : r.status === 'GAGAL_DISALURKAN' ? 'Gagal Disalurkan' : 'Belum Disalurkan',
      'Penerima Riil': r.namaPenerimaNyata || '-',
      'Hubungan': r.hubunganDenganKpm || '-',
      'Waktu Serah Terima': r.waktuSerahTerima ? new Date(r.waktuSerahTerima).toLocaleString('id-ID') : '-',
      'Petugas': r.petugasPenyalur || '-',
      'Keterangan / Catatan': r.alasanGagal || r.catatan || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan_Penyaluran');
    XLSX.writeFile(workbook, `Laporan_Penyaluran_Bansos_${programNama.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    this.logAudit('EXPORT', 'PENYALURAN', 'export-report', `Mengekspor laporan penyaluran bansos (${filteredRows.length} data) ke Excel`);
  }

  // --- PUBLIC CHECK BY NIK ---
  public checkNikPublic(nikInput: string): { 
    found: boolean; 
    namaMasked?: string; 
    nikMasked?: string;
    dusun?: string;
    bantuanList?: Array<{
      program: string;
      periode: string;
      status: string;
      nominal?: string;
      waktuPencairan?: string;
    }>;
    message?: string;
  } {
    const clean = nikInput.trim();
    if (!/^\d{16}$/.test(clean)) {
      return { found: false, message: 'Masukkan tepat 16 digit NIK Anda sesuai KTP.' };
    }

    const warga = this.warga.find(w => w.nik === clean);
    if (!warga) {
      return { 
        found: false, 
        message: `NIK ${clean.slice(0, 4)}********${clean.slice(-4)} tidak terdaftar sebagai penerima bantuan sosial di Desa Sukamaju periode ini.` 
      };
    }

    // Mask name: e.g. "Mbah Suparmi" -> "M*** S******"
    const nameParts = warga.nama.split(' ');
    const maskedName = nameParts.map(part => {
      if (part.length <= 2) return part;
      return part[0] + '*'.repeat(part.length - 1);
    }).join(' ');

    // Collect all assistance history
    const bantuanList: any[] = [];

    // Check confirmed distributions
    const distRecords = this.penerima.filter(p => p.wargaId === warga.id);
    for (const d of distRecords) {
      const prog = this.programs.find(p => p.id === d.programId);
      bantuanList.push({
        program: d.programNama,
        periode: prog?.periode || 'Tahun 2026',
        status: d.status === 'SUDAH_DISALURKAN' ? 'Tersalurkan' : d.status === 'GAGAL_DISALURKAN' ? 'Gagal Disalurkan' : 'Siap Disalurkan',
        nominal: prog ? (prog.jenis === 'Uang Tunai' ? `Rp ${prog.nominalPerKpm.toLocaleString('id-ID')}` : prog.keteranganBarang || 'Sembako') : '-',
        waktuPencairan: d.waktuSerahTerima ? new Date(d.waktuSerahTerima).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : 'Menunggu Jadwal'
      });
    }

    // Also check approved proposals that might not yet have distribution schedules
    const usulanRecords = this.usulan.filter(u => u.wargaId === warga.id && u.status === 'DISETUJUI');
    for (const u of usulanRecords) {
      const prog = this.programs.find(p => p.id === u.rekomendasiProgramId);
      const alreadyInList = bantuanList.some(b => b.program === (prog?.nama || ''));
      if (!alreadyInList && prog) {
        bantuanList.push({
          program: prog.nama,
          periode: prog.periode,
          status: 'Penetapan Disetujui (Menunggu Penjadwalan)',
          nominal: prog.jenis === 'Uang Tunai' ? `Rp ${prog.nominalPerKpm.toLocaleString('id-ID')}` : prog.keteranganBarang,
          waktuPencairan: 'Dalam Proses Distribusi'
        });
      }
    }

    return {
      found: true,
      namaMasked: maskedName,
      nikMasked: `${clean.slice(0, 4)}********${clean.slice(-4)}`,
      dusun: warga.dusun,
      bantuanList
    };
  }
}

export const db = new DataStore();
