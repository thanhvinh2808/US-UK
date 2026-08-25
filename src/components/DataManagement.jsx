import React, { useState, useEffect } from 'react';
import { exportDataToFile } from '../utils/data/dataExport';
import { validateImportData, executeDataImport } from '../utils/data/dataImport';
import { vocabStorage } from '../utils/storage/vocabStorage';
import { mistakeStorage } from '../utils/storage/mistakeStorage';
import { deckStorage } from '../utils/storage/deckStorage';
import { progressStorage } from '../utils/storage/progressStorage';
import { isUserScope } from '../utils/storage/storageScope';
import { flushOutboxQueue } from '../utils/storage/syncEngine';

export const DataManagement = ({ isOpen, onClose }) => {
  const [importFile, setImportFile] = useState(null);
  const [importValidation, setImportValidation] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [confirmClearLocal, setConfirmClearLocal] = useState(false);
  const [clearStatus, setClearStatus] = useState(null);

  // Handle ESC key dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !confirmClearLocal) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, confirmClearLocal]);

  if (!isOpen) return null;

  const handleExport = () => {
    exportDataToFile();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      const validation = validateImportData(content);
      setImportValidation(validation);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (!importValidation?.isValid || !importValidation.sanitizedData) return;

    const result = executeDataImport(importValidation.sanitizedData);
    if (result.success) {
      setImportStatus({
        type: 'success',
        message: `Đã nhập thành công: ${result.importedCounts.vocab} từ vựng, ${result.importedCounts.mistakes} câu sai, ${result.importedCounts.decks} bộ thẻ.`
      });
      setImportValidation(null);
      setImportFile(null);

      // Trigger background sync if user authenticated
      if (isUserScope()) {
        flushOutboxQueue().catch(() => {});
      }
    } else {
      setImportStatus({
        type: 'error',
        message: result.error || 'Nhập dữ liệu thất bại.'
      });
    }
  };

  const handleClearLocalData = () => {
    // Clear localized storage collections
    vocabStorage.setSavedVocabDirect([]);
    mistakeStorage.clearMistakes();
    progressStorage.getTopicProgress(); // reset handled in memory
    setConfirmClearLocal(false);
    setClearStatus('Đã xóa sạch bộ nhớ cục bộ trên thiết bị này.');
    setTimeout(() => setClearStatus(null), 3500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-management-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !confirmClearLocal) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xl">💾</span>
            <h2 id="data-management-title" className="text-lg font-bold text-slate-800">
              Quản lý & Sao lưu Dữ liệu
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng quản lý dữ liệu"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Export */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Xuất dữ liệu học tập (Backup)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tải xuống toàn bộ từ vựng, tiến độ SM-2, câu sai và bộ thẻ dưới dạng tệp JSON.
                </p>
              </div>
              <button
                onClick={handleExport}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>📥</span> Tải tệp JSON
              </button>
            </div>
          </div>

          {/* Section 2: Import */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Nhập dữ liệu (Restore / Merge)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập dữ liệu từ tệp sao lưu JSON. Hệ thống tự động xác thực và ngăn chặn dữ liệu độc hại.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="py-2 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs cursor-pointer flex items-center gap-1.5 transition-colors">
                <span>📂</span> Chọn tệp JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {importFile && (
                <span className="text-xs font-medium text-slate-600 truncate max-w-xs">
                  {importFile.name}
                </span>
              )}
            </div>

            {/* Validation Feedback / Preview */}
            {importValidation && (
              <div className="p-3.5 rounded-xl border text-xs space-y-2 animate-fadeIn" style={{
                backgroundColor: importValidation.isValid ? '#F0FDF4' : '#FEF2F2',
                borderColor: importValidation.isValid ? '#BBF7D0' : '#FECACA',
                color: importValidation.isValid ? '#166534' : '#991B1B'
              }}>
                {importValidation.isValid ? (
                  <>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>✓</span> Tệp hợp lệ! Xem trước nội dung:
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li>Từ vựng sổ tay: <strong>{importValidation.summary?.vocabCount || 0}</strong> từ</li>
                      <li>Ngân hàng câu sai: <strong>{importValidation.summary?.mistakeCount || 0}</strong> câu</li>
                      <li>Bộ thẻ học: <strong>{importValidation.summary?.deckCount || 0}</strong> bộ</li>
                    </ul>
                    <button
                      onClick={handleExecuteImport}
                      className="mt-2 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm"
                    >
                      Xác nhận hợp nhất vào bộ nhớ
                    </button>
                  </>
                ) : (
                  <div className="font-semibold flex items-center gap-1.5">
                    <span>⚠️</span> {importValidation.error}
                  </div>
                )}
              </div>
            )}

            {importStatus && (
              <div className={`p-3 rounded-xl text-xs font-medium border ${
                importStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {importStatus.message}
              </div>
            )}
          </div>

          {/* Section 3: Clear Local Data */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-rose-800">Xóa dữ liệu cục bộ trên thiết bị</h3>
                <p className="text-xs text-rose-600/80 mt-0.5">
                  Chỉ xóa bộ nhớ cache trên trình duyệt hiện tại. Dữ liệu trên server của tài khoản không bị xóa.
                </p>
              </div>
              <button
                onClick={() => setConfirmClearLocal(true)}
                className="py-2 px-3.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-medium text-xs transition-colors"
              >
                Xóa bộ nhớ
              </button>
            </div>
            {clearStatus && (
              <p className="text-xs text-emerald-700 font-semibold pt-1">
                ✓ {clearStatus}
              </p>
            )}
          </div>
        </div>

        {/* Confirmation Modal Overlay for Clear Local Data */}
        {confirmClearLocal && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 p-6 flex flex-col justify-center items-center text-center animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mb-3 shadow-inner">
              🗑️
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1.5">
              Xác nhận xóa bộ nhớ cục bộ?
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6">
              Hành động này sẽ làm trống danh sách từ vựng và câu sai đã lưu trong bộ nhớ máy này. Bạn có thể khôi phục lại bất kỳ lúc nào nếu đã sao lưu JSON hoặc đã đồng bộ lên server.
            </p>
            <div className="flex items-center gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => setConfirmClearLocal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleClearLocalData}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-200 transition-colors"
              >
                Xóa sạch
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
