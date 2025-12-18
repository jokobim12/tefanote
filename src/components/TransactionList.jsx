import { Trash2, FileDown, Search, ArrowUpDown, Printer, Package, Globe, Tag, ChevronLeft, ChevronRight, Calendar, DollarSign, Pencil, AlertCircle, Save, X, Plus } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { useState, useMemo, useEffect } from 'react';
import Modal from './Modal';

export default function TransactionList({ transactions, onDelete, onEdit, onClearAll, isFiltered, selectedDate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  
  // Modal States
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, type: 'single' });
  const [editModal, setEditModal] = useState({ isOpen: false });
  const [editData, setEditData] = useState(null);

  const itemsPerPage = 5;

  // Helper to get consistent values
  const getValue = (item, type) => {
    const isGroup = item.items && Array.isArray(item.items);
    if (type === 'total') return isGroup ? (item.totalPrice || 0) : (item.total || item.price * item.qty || 0);
    if (type === 'date') return new Date(item.date).getTime();
    return 0;
  };

  // Filter & Sort
  const processedData = useMemo(() => {
    let data = transactions.filter(t => {
        const term = searchTerm.toLowerCase();
        if (t.customerName?.toLowerCase().includes(term)) return true;
        if (t.itemName?.toLowerCase().includes(term)) return true;
        if (t.items && Array.isArray(t.items)) {
            return t.items.some(item => item.itemName.toLowerCase().includes(term));
        }
        return false;
    });

    data.sort((a, b) => {
      let valA = getValue(a, sortConfig.key);
      let valB = getValue(b, sortConfig.key);
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [transactions, searchTerm, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // --- DELETE LOGIC ---
  const confirmDelete = (id) => {
      setDeleteModal({ isOpen: true, id, type: 'single' });
  };

  const confirmClearAll = () => {
      setDeleteModal({ isOpen: true, id: null, type: 'all' });
  };

  const executeDelete = () => {
      if (deleteModal.type === 'all') {
          onClearAll();
      } else {
          onDelete(deleteModal.id);
      }
      setDeleteModal({ ...deleteModal, isOpen: false });
  };

  // --- EDIT LOGIC ---
  const startEdit = (transaction) => {
      // Deep copy to avoid mutating state directly
      const dataToEdit = JSON.parse(JSON.stringify(transaction));
      
      // Normalize to grouped structure for editing consistency
      if (!dataToEdit.items || !Array.isArray(dataToEdit.items)) {
          dataToEdit.items = [{
              id: crypto.randomUUID(),
              itemName: dataToEdit.itemName,
              price: dataToEdit.price,
              qty: dataToEdit.qty,
              total: dataToEdit.total || (dataToEdit.price * dataToEdit.qty),
              type: dataToEdit.type
          }];
          dataToEdit.type = 'group'; // Switch to group type
      }
      
      setEditData(dataToEdit);
      setEditModal({ isOpen: true });
  };

  const updateEditItem = (index, field, value) => {
      const newItems = [...editData.items];
      newItems[index][field] = value;
      
      // Recalculate item total
      if (field === 'price' || field === 'qty') {
          newItems[index].total = Number(newItems[index].price) * Number(newItems[index].qty);
      }
      
      // Recalculate transaction total
      const newTotalPrice = newItems.reduce((sum, item) => sum + item.total, 0);
      
      setEditData({ ...editData, items: newItems, totalPrice: newTotalPrice });
  };

  const removeEditItem = (index) => {
      if (editData.items.length <= 1) {
          toast.error("Minimal harus ada 1 item.");
          return;
      }
      const newItems = editData.items.filter((_, i) => i !== index);
      const newTotalPrice = newItems.reduce((sum, item) => sum + item.total, 0);
      setEditData({ ...editData, items: newItems, totalPrice: newTotalPrice });
  };

  const saveEdit = () => {
      onEdit(editData);
      setEditModal({ isOpen: false });
  };


  const generatePDF = () => {
    if (processedData.length === 0) {
      toast.error("Tidak ada data untuk diekspor.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Laporan Keuangan TefaNote", 14, 15);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);

    const tableColumn = ["No", "Tanggal", "Pembeli", "Detail Transaksi", "Total"];
    const tableRows = [];

    processedData.forEach((t, index) => {
      let detailString = '';
      let totalValue = getValue(t, 'total');

      if (t.items && Array.isArray(t.items)) {
          detailString = t.items.map(i => `- ${i.itemName} (${i.qty}x)`).join('\n');
      } else {
          detailString = `${t.itemName} (${t.qty}x) @ ${t.price.toLocaleString('id-ID')}`;
      }

      tableRows.push([
        index + 1,
        new Date(t.date).toLocaleDateString('id-ID'),
        t.customerName || '-',
        detailString,
        `Rp ${totalValue.toLocaleString('id-ID')}`
      ]);
    });

    // Total filtered income
    const totalIncome = processedData.reduce((sum, t) => sum + getValue(t, 'total'), 0);
    tableRows.push(['', '', '', 'TOTAL HALAMAN INI', `Rp ${totalIncome.toLocaleString('id-ID')}`]); 

    autoTable(doc, {
      startY: 25,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 8, cellPadding: 3 },
    });

    doc.save(`tefanote_report_${new Date().getTime()}.pdf`);
    toast.success("PDF berhasil diunduh!");
  };

  return (
    <>
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full animate-in fade-in slide-in-from-bottom-2">
      {/* Header Section */}
      <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
           <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Riwayat Transaksi
              {isFiltered && (
                  <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                  </span>
              )}
           </h2>
           <div className="flex items-center gap-2 text-xs text-slate-500">
             <span>Total {processedData.length} transaksi</span>
             {transactions.length > 0 && (
                <button onClick={confirmClearAll} className="text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 ml-2">
                    <Trash2 size={10} /> Hapus Semua
                </button>
             )}
           </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-56">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari transaksi..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); 
              }}
            />
          </div>

          {/* Sort Controls */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
             <button
               onClick={() => handleSort('total')}
               className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sortConfig.key === 'total' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <DollarSign size={14} />
                Nominal
                {sortConfig.key === 'total' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />}
             </button>
          </div>

          <button 
            onClick={generatePDF}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors active:scale-95 whitespace-nowrap"
          >
            <FileDown size={16} />
            Ekspor PDF
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto flex-1 p-2 min-h-[400px]">
        <table className="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <th className="p-3 border-b border-slate-200 w-12 text-center">No</th>
              <th className="p-3 border-b border-slate-200 w-32">Tanggal</th>
              <th className="p-3 border-b border-slate-200 w-48">Pembeli</th>
              <th className="p-3 border-b border-slate-200">Detail Item (Barang/Jasa)</th>
              <th className="p-3 border-b border-slate-200 text-right w-36">Total</th>
              <th className="p-3 border-b border-slate-200 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500 text-sm">
                  {transactions.length === 0 ? "Belum ada data transaksi." : "Data tidak ditemukan."}
                </td>
              </tr>
            ) : (
              paginatedData.map((t, idx) => {
                const isGroup = t.items && Array.isArray(t.items);
                const grandTotal = getValue(t, 'total');
                const rowNumber = ((currentPage - 1) * itemsPerPage) + idx + 1;

                return (
                  <tr key={t.id} className="hover:bg-blue-50/30 transition-colors text-sm text-slate-700 align-top">
                    <td className="p-4 text-center text-slate-400 font-mono text-xs">
                      {rowNumber}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{new Date(t.date).toLocaleDateString('id-ID')}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{new Date(t.date).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="p-4">
                      {t.customerName && t.customerName !== '-' ? (
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs capitalize">
                            {t.customerName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">-</span>
                      )}
                    </td>
                    
                    <td className="p-4">
                        {isGroup ? (
                            <div className="space-y-2">
                                {t.items.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded border border-slate-100/50">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="text-slate-400 shrink-0">
                                                {item.type === 'print' ? <Printer size={12} /> : 
                                                 item.type === 'service' ? <Globe size={12} /> : 
                                                 <Package size={12} />}
                                            </span>
                                            <span className="font-medium text-slate-700 truncate">{item.itemName}</span>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0 ml-2">
                                            <div className="bg-white px-1.5 rounded border border-slate-200 text-[10px] font-mono text-slate-500">
                                                {item.qty} x
                                            </div>
                                            <div className="font-mono text-slate-600 w-16 text-right">
                                                {item.total.toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between text-xs bg-yellow-50 p-2 rounded border border-yellow-100/50">
                                <div className="flex items-center gap-2">
                                    <span className="text-yellow-600/70">
                                        {t.type === 'print' ? <Printer size={12} /> : 
                                         t.type === 'service' ? <Globe size={12} /> : 
                                         <Tag size={12} />}
                                    </span>
                                    <span className="font-medium text-yellow-800">{t.itemName}</span>
                                </div>
                                <div className="flex items-center gap-3 ml-2">
                                    <div className="bg-white/50 px-1.5 rounded border border-yellow-200 text-[10px] font-mono text-yellow-700">
                                        {t.qty} x
                                    </div>
                                    <div className="font-mono text-yellow-800 w-16 text-right">
                                        {(t.total || t.price * t.qty).toLocaleString('id-ID')}
                                    </div>
                                </div>
                            </div>
                        )}
                    </td>

                    <td className="p-4 text-right">
                      <span className="font-bold text-slate-800 bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-xs border border-emerald-100 inline-block whitespace-nowrap">
                        Rp {grandTotal.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => startEdit(t)}
                          className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                          title="Edit Transaksi"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(t.id)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                          title="Hapus Transaksi"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="text-xs text-slate-500">
                    Halaman <span className="font-bold text-slate-700">{currentPage}</span> dari {totalPages}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 active:scale-95 transition-all"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 active:scale-95 transition-all"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        )}
    </div>

    {/* Custom Modal for Delete Confirmation */}
    <Modal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({...deleteModal, isOpen: false})}
        title={deleteModal.type === 'all' ? "Hapus Semua Riwayat?" : "Hapus Transaksi?"}
    >
        <div className="flex flex-col items-center text-center p-4">
            <div className="bg-red-100 p-4 rounded-full mb-4 animate-bounce">
                <AlertCircle size={48} className="text-red-600" />
            </div>
            <h4 className="text-xl font-bold text-slate-800 mb-2">
                {deleteModal.type === 'all' ? "Tindakan Berbahaya!" : "Anda yakin?"}
            </h4>
            <p className="text-slate-500 text-sm mb-6">
                {deleteModal.type === 'all' 
                    ? "Semua riwayat transaksi akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan." 
                    : "Data transaksi ini akan dihapus permanen dari riwayat Anda."}
            </p>
            <div className="flex gap-3 w-full">
                <button 
                    onClick={() => setDeleteModal({...deleteModal, isOpen: false})}
                    className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                    Batalkan
                </button>
                <button 
                    onClick={executeDelete}
                    className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-transform active:scale-95"
                >
                    Ya, Hapus
                </button>
            </div>
        </div>
    </Modal>

    {/* Custom Modal for Editing */}
    <Modal 
        isOpen={editModal.isOpen} 
        onClose={() => setEditModal({ isOpen: false })}
        title="Edit Transaksi"
        maxWidth="max-w-2xl"
    >
        {editData && (
            <div className="space-y-4">
                {/* Header Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal</label>
                        <input 
                            type="datetime-local" 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            value={editData.date.slice(0, 16)}
                            onChange={(e) => setEditData({...editData, date: new Date(e.target.value).toISOString()})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nama Pembeli</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            placeholder="Nama pembeli..."
                            value={editData.customerName}
                            onChange={(e) => setEditData({...editData, customerName: e.target.value})}
                        />
                    </div>
                </div>

                {/* Items List */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 flex justify-between">
                        <span>Daftar Item</span>
                        <span>Total: Rp {editData.totalPrice.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                        {editData.items.map((item, idx) => (
                            <div key={idx} className="p-3 flex items-center gap-3">
                                <div className="flex-1">
                                    <input 
                                        type="text"
                                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm mb-1"
                                        value={item.itemName}
                                        onChange={(e) => updateEditItem(idx, 'itemName', e.target.value)}
                                    />
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-24">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">Qty</span>
                                            <input 
                                                type="number" 
                                                min="1"
                                                className="w-full pl-8 pr-2 py-1 border border-slate-200 rounded text-xs"
                                                value={item.qty}
                                                onChange={(e) => updateEditItem(idx, 'qty', e.target.value)}
                                            />
                                        </div>
                                        <div className="relative w-32">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                                            <input 
                                                type="number" 
                                                min="0"
                                                className="w-full pl-8 pr-2 py-1 border border-slate-200 rounded text-xs"
                                                value={item.price}
                                                onChange={(e) => updateEditItem(idx, 'price', e.target.value)}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 ml-auto">
                                            {item.total.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeEditItem(idx)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button 
                         onClick={() => setEditModal({ isOpen: false })}
                         className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
                    >
                        Batal
                    </button>
                    <button 
                         onClick={saveEdit}
                         className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                    >
                        <Save size={16} /> Simpan Perubahan
                    </button>
                </div>
            </div>
        )}
    </Modal>
    </>
  );
}
