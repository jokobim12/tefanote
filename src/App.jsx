import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useLocalStorage } from './hooks/useLocalStorage';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import StatsCard from './components/StatsCard';
import Modal from './components/Modal';
import CalendarModal from './components/CalendarModal';
import SplashScreen from './components/SplashScreen'; // Import
import SettingsModal from './components/SettingsModal';
import AiAssistant from './components/AiAssistant';
import { PRESET_ITEMS } from './constants/items';
import { NotebookPen, AlertCircle, Calendar, Settings } from 'lucide-react';

function App() {
  const [isLoading, setIsLoading] = useState(true); // Loading State
  const [transactions, setTransactions] = useLocalStorage('tefanote_transactions', []);
  
  // State untuk Filter Tanggal (Default: Hari Ini)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Product Presets State
  const [presetItems, setPresetItems] = useLocalStorage('tefanote_presets', 
      PRESET_ITEMS.map(i => ({...i, id: crypto.randomUUID()})) 
  );
  
  // API Key State
  const [apiKey, setApiKey] = useLocalStorage('tefanote_apikey', '');

  const handleResetPresets = () => {
      setPresetItems(PRESET_ITEMS.map(i => ({...i, id: crypto.randomUUID()})));
      toast.success("Produk dikembalikan ke pengaturan awal.");
  };

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 2500); // 2.5s duration
    return () => clearTimeout(timer);
  }, []);

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
      <SplashScreen isLoading={isLoading} />
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="w-full md:w-[90%] xl:max-w-[1400px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-y-3">
          {/* 1. Logo Section */}
          <div className="flex items-center gap-3 order-1">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-blue-200">
              <NotebookPen size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent leading-tight">
                TefaNote
              </h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">Financial Record</p>
            </div>
          </div>
          
          {/* 2. Settings Button (Mobile: Top Right, Desktop: Far Right) */}
          <button 
                onClick={() => setIsSettingsOpen(true)}
                className="order-2 sm:order-3 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors border border-transparent hover:border-slate-200"
                title="Pengaturan Produk"
          >
                <Settings size={20} />
          </button>

          {/* 3. Date Picker (Mobile: Full Width Bottom, Desktop: Middle Right) */}
          <div className="order-3 sm:order-2 w-full sm:w-auto">
             <button 
                onClick={() => setIsCalendarOpen(true)}
                className="w-full sm:w-auto group relative flex items-center justify-between sm:justify-start gap-3 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
             >
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-slate-700">
                        {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors block sm:hidden">
                    Ganti
                </div>
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full md:w-[90%] xl:max-w-[1400px] mx-auto px-4 py-6 md:py-8">
        
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
                <TransactionForm onAddTransaction={addTransactions} items={presetItems} />
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
        <div className="w-full md:w-[90%] xl:max-w-[1400px] mx-auto px-4 text-center">
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

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        items={presetItems}
        onUpdateItems={setPresetItems}
        onResetDefault={handleResetPresets}
        apiKey={apiKey}
        onUpdateApiKey={setApiKey}
      />
      
      <AiAssistant 
        apiKey={apiKey}
        transactions={transactions}
        stats={{
            totalIncome: finalTotalIncome,
            transactionCount: finalTotalCount
        }}
        todayIncome={(() => {
            const todayStr = new Date().toISOString().split('T')[0];
            return transactions
                .filter(t => t.date.startsWith(todayStr))
                .reduce((sum, t) => sum + (t.totalPrice || t.total || 0), 0) + (new Date(selectedDate).toISOString().split('T')[0] === todayStr ? archivedStats.todayIncome : 0);
        })()}
      />
    </div>
  );
}

export default App;
