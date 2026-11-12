import React, { useState } from 'react';
import { db } from '../services/storage';
import { AuditLog, AuditAction } from '../types';
import { ShieldAlert, Search, Filter, RefreshCw } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(db.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const refreshLogs = () => {
    setLogs(db.getAuditLogs());
  };

  const filtered = logs.filter(log => {
    const matchSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500 font-medium">Transparansi & Akuntabilitas Publik</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            Log Audit Aktivitas Sistem (Audit Trail)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekam jejak digital pencatatan, verifikasi, approval SK, serta distribusi bantuan sosial desa.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshLogs}
          className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Muat Ulang Log</span>
        </button>
      </div>

      {/* Filter and search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama petugas atau rincian aktivitas..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500">Filter Aksi:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">Semua Aksi</option>
            <option value="CREATE">CREATE (Tambah Data)</option>
            <option value="VERIFY">VERIFY (Verifikasi)</option>
            <option value="APPROVE">APPROVE (Persetujuan Kades)</option>
            <option value="REJECT">REJECT (Penolakan)</option>
            <option value="DISTRIBUTE">DISTRIBUTE (Serah Terima)</option>
            <option value="IMPORT">IMPORT (Impor Data)</option>
            <option value="EXPORT">EXPORT (Ekspor Data)</option>
            <option value="UPDATE">UPDATE (Perubahan)</option>
            <option value="DELETE">DELETE (Penghapusan)</option>
          </select>
          <span className="text-slate-400 font-mono text-[11px] ml-2">
            ({filtered.length} log)
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-40">Stempel Waktu</th>
                <th className="py-3 px-4">Pengguna (Aktor)</th>
                <th className="py-3 px-4 text-center">Tipe Aksi</th>
                <th className="py-3 px-4">Entitas Terkait</th>
                <th className="py-3 px-4">Rincian Perubahan Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600 tabular-nums">
                      {new Date(log.timestamp).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-blue-600 font-mono font-medium">{log.userRole}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'APPROVE' ? 'bg-emerald-100 text-emerald-800' :
                        log.action === 'VERIFY' ? 'bg-blue-100 text-blue-800' :
                        log.action === 'DISTRIBUTE' ? 'bg-amber-100 text-amber-800' :
                        log.action === 'REJECT' ? 'bg-rose-100 text-rose-800' :
                        log.action === 'DELETE' ? 'bg-rose-100 text-rose-800' :
                        log.action === 'IMPORT' ? 'bg-purple-100 text-purple-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                      {log.entity}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 leading-relaxed">
                      {log.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada log aktivitas sesuai kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
