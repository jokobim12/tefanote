import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useLocalStorage } from './hooks/useLocalStorage';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import StatsCard from './components/StatsCard';
import Modal from './components/Modal';
import CalendarModal from './components/CalendarModal';
import { NotebookPen, AlertCircle, Calendar } from 'lucide-react';

function App() {
  const [transactions, setTransactions] = useLocalStorage('tefanote_transactions', []);
  
  // State untuk Filter Tanggal (Default: Hari Ini)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Archived Stats untuk menyimpan nilai transaksi yang dihapus
  const [archivedStats, setArchivedStats] = useState(() => {
    const saved = localStorage.getItem('tefanote_archived_stats');
    return saved ? JSON.parse(saved) : { totalIncome: 0, totalCount: 0, todayIncome: { date: '', amount: 0 } };
  });

  const [resetConfirmModal, setResetConfirmModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('tefanote_archived_stats', JSON.stringify(archivedStats));
  }, [archivedStats]);

  const addTransactions = (newTransactions) => {
    const itemsToAdd = Array.isArray(newTransactions) ? newTransactions : [newTransactions];
    // Pastikan transaksi baru tanggalnya sesuai saat input (biasanya now), tidak dipaksa ke selectedDate kecuali user input manual.
    // TransactionForm menghandle tanggal sendiri (default now).
    setTransactions(prev => [...prev, ...itemsToAdd]);
    toast.success('Transaksi berhasil disimpan!');
    
    // Auto switch view to transaction date if needed? No, let user stay where they are or maybe switch to Today if easiest.
    // For now keep as is.
  };

  // Helper to calculate transaction value
  const calculateValue = (t) => {
     return (t.items && Array.isArray(t.items)) ? (t.totalPrice || 0) : (t.total || t.price * t.qty || 0);
  };

  const addToArchive = (itemsToDelete) => {
      const items = Array.isArray(itemsToDelete) ? itemsToDelete : [itemsToDelete];
      const today = new Date().toISOString().split('T')[0];
      
      let incomeToAdd = 0;
      let todayIncomeToAdd = 0;

      items.forEach(t => {
          const val = calculateValue(t);
          incomeToAdd += val;
          if (t.date.startsWith(today)) {
              todayIncomeToAdd += val;
          }
      });

      setArchivedStats(prev => {
          const isSameDay = prev.todayIncome.date === today;
          return {
              totalIncome: prev.totalIncome + incomeToAdd,
              totalCount: prev.totalCount + items.length,
              todayIncome: {
                  date: today,
                  amount: (isSameDay ? prev.todayIncome.amount : 0) + todayIncomeToAdd
              }
          };
      });
  };

  const deleteTransaction = (id) => {
      const transactionToDelete = transactions.find(t => t.id === id);
      if (transactionToDelete) {
          addToArchive(transactionToDelete);
          setTransactions(prev => prev.filter(t => t.id !== id));
          toast.success('Transaksi dihapus (Nilai tetap tersimpan).');
      }
  };

  const editTransaction = (updatedTransaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    toast.success('Transaksi berhasil diperbarui.');
  };

  const clearTransactions = () => {
      addToArchive(transactions); 
      setTransactions([]);
      toast.success('Semua riwayat transaksi dihapus (Statistik diamankan).');
  };

  const resetStats = () => {
      setArchivedStats({ totalIncome: 0, totalCount: 0, todayIncome: { date: '', amount: 0 } });
      setResetConfirmModal(false);
      toast.success('Statistik pemasukan berhasil di-reset.');
  };

  // --- CALCULATION LOGIC ---

  // 1. Total Income (Global)
  const currentTotalIncome = transactions.reduce((acc, t) => acc + calculateValue(t), 0);
  const finalTotalIncome = currentTotalIncome + archivedStats.totalIncome;

  // 2. Selected Date Income (Active + Archive if Today)
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  
  const selectedDateTransactions = transactions.filter(t => t.date.startsWith(selectedDate));
  
  const currentSelectedDateIncome = selectedDateTransactions.reduce((acc, t) => acc + calculateValue(t), 0);
  
  // Archive only stores specific 'todayIncome' cache. 
  // Ideally archive should store history by date, but for now we only support "Today" persistence perfectly.
  // If user views past dates, we only show Active transactions (Archive is lumped into total).
  const archiveAmountForDate = (isToday && archivedStats.todayIncome.date === selectedDate) ? archivedStats.todayIncome.amount : 0;
  
  const finalSelectedDateIncome = currentSelectedDateIncome + archiveAmountForDate;
  
  const finalTotalCount = transactions.length + archivedStats.totalCount;

  // Date Label for Stats
  const dateLabel = isToday 
    ? "Pemasukan Hari Ini" 
    : `Pemasukan ${new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[85%] xl:max-w-[1400px] mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <NotebookPen size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                TefaNote
              </h1>
              <p className="text-xs text-slate-500">Pencatat Keuangan Sederhana</p>
            </div>
          </div>
          
          {/* Date Picker Custom Trigger */}
          <div className="text-right">
             <div className="text-xs text-slate-400 mb-0.5">Filter Tanggal</div>
             <button 
                onClick={() => setIsCalendarOpen(true)}
                className="group relative inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
             >
                <Calendar size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-slate-700">
                    {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[85%] xl:max-w-[1400px] mx-auto px-4 py-8">
        
        <StatsCard 
            totalIncome={finalTotalIncome} 
            todayIncome={finalSelectedDateIncome} 
            transactionCount={finalTotalCount}
            onReset={() => setResetConfirmModal(true)}
            dateLabel={dateLabel}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form (4 cols) */}
          <div className="lg:col-span-4">
             <div className="sticky top-24">
                <TransactionForm onAddTransaction={addTransactions} />
             </div>
          </div>

          {/* Right Column: List (8 cols) */}
          <div className="lg:col-span-8">
            <TransactionList 
              transactions={selectedDateTransactions} 
              onDelete={deleteTransaction} 
              onEdit={editTransaction}
              onClearAll={clearTransactions}
              isFiltered={!isToday}
              selectedDate={selectedDate}
            />
          </div>
        </div>
      </main>

      {/* Reset Stats Modal */}
      <Modal 
          isOpen={resetConfirmModal} 
          onClose={() => setResetConfirmModal(false)}
          title="Reset Statistik?"
      >
          <div className="flex flex-col items-center text-center p-4">
              <div className="bg-red-100 p-4 rounded-full mb-4 animate-bounce">
                  <AlertCircle size={48} className="text-red-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">
                  Atur Ulang Pemasukan?
              </h4>
              <p className="text-slate-500 text-sm mb-6">
                  Total Pemasukan akan dihitung ulang hanya dari transaksi yang saat ini ada di tabel. Arsip pemasukan lama akan dihapus.
              </p>
              <div className="flex gap-3 w-full">
                  <button 
                      onClick={() => setResetConfirmModal(false)}
                      className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                  >
                      Batalkan
                  </button>
                  <button 
                      onClick={resetStats}
                      className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-transform active:scale-95"
                  >
                      Ya, Reset
                  </button>
              </div>
          </div>
      </Modal>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-[85%] xl:max-w-[1400px] mx-auto px-4 text-center">
            <p className="text-slate-500 text-sm">
                &copy; {new Date().getFullYear()} TefaNote. Created by <span className="font-bold text-gray-900">Jokobim</span>
            </p>
        </div>
      </footer>

      <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
        selectedDate={selectedDate}
        onSelect={setSelectedDate} 
      />
    </div>
  );
}

export default App;
