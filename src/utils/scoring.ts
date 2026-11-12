import { Warga, RincianSkor, KategoriKelayakan } from '../types';

export function hitungSkorKelayakan(warga: Partial<Warga>): { skor: number; kategori: KategoriKelayakan; rincian: RincianSkor } {
  let penghasilanScore = 0;
  const penghasilan = warga.penghasilan ?? 0;
  if (penghasilan <= 600000) {
    penghasilanScore = 35;
  } else if (penghasilan <= 1000000) {
    penghasilanScore = 28;
  } else if (penghasilan <= 1500000) {
    penghasilanScore = 20;
  } else if (penghasilan <= 2200000) {
    penghasilanScore = 10;
  } else {
    penghasilanScore = 0;
  }

  // 2. Perumahan (max 30)
  let perumahanScore = 0;
  // Lantai (max 10)
  switch (warga.kondisiLantai) {
    case 'Tanah': perumahanScore += 10; break;
    case 'Semen Kasar': perumahanScore += 7; break;
    case 'Keramik Rusak': perumahanScore += 4; break;
    default: perumahanScore += 0; break;
  }

  // Dinding (max 10)
  switch (warga.kondisiDinding) {
    case 'Bambu / Gedek': perumahanScore += 10; break;
    case 'Papan Kayu': perumahanScore += 7; break;
    case 'Tembok Tanpa Plester': perumahanScore += 4; break;
    default: perumahanScore += 0; break;
  }

  // Atap (max 6)
  switch (warga.kondisiAtap) {
    case 'Rumbia / Ijuk': perumahanScore += 6; break;
    case 'Seng Berkarat': perumahanScore += 4; break;
    case 'Genteng Tanah': perumahanScore += 2; break;
    default: perumahanScore += 0; break;
  }

  // Listrik (max 4)
  switch (warga.dayaListrik) {
    case 'Non-PLN / 450 VA': perumahanScore += 4; break;
    case '900 VA': perumahanScore += 2; break;
    default: perumahanScore += 0; break;
  }
  perumahanScore = Math.min(30, perumahanScore);

  // 3. Tanggungan (max 20)
  let tanggunganScore = 0;
  const tanggungan = warga.jumlahTanggungan ?? 0;
  if (tanggungan >= 5) {
    tanggunganScore = 20;
  } else if (tanggungan >= 3) {
    tanggunganScore = 15;
  } else if (tanggungan >= 1) {
    tanggunganScore = 8;
  } else {
    tanggunganScore = 0;
  }

  // 4. Kerentanan (max 15)
  let kerentananScore = 0;
  if (warga.lansiaDisabilitas) {
    kerentananScore += 10;
  }
  if (warga.statusRumah === 'Menumpang' || warga.statusRumah === 'Bukan Milik Sendiri') {
    kerentananScore += 5;
  }
  kerentananScore = Math.min(15, kerentananScore);

  const total = penghasilanScore + perumahanScore + tanggunganScore + kerentananScore;

  let kategori: KategoriKelayakan = 'TIDAK_LAYAK';
  if (total >= 70) {
    kategori = 'SANGAT_LAYAK';
  } else if (total >= 50) {
    kategori = 'LAYAK';
  } else {
    kategori = 'TIDAK_LAYAK';
  }

  return {
    skor: total,
    kategori,
    rincian: {
      penghasilanScore,
      perumahanScore,
      tanggunganScore,
      kerentananScore,
      total
    }
  };
}

export function maskNik(nik: string): string {
  if (!nik || nik.length < 8) return nik;
  // e.g. 3507123456780001 -> 3507********0001
  return `${nik.slice(0, 4)}********${nik.slice(-4)}`;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}
