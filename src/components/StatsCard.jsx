import { Wallet, TrendingUp, ShoppingBag, RotateCcw } from 'lucide-react';

export default function StatsCard({ totalIncome, todayIncome, transactionCount, onReset, dateLabel }) {
  const cardClass = "bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4 transition-all hover:shadow-md";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className={`${cardClass} relative group`}>
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <Wallet size={24} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-500 font-medium">Total Pemasukan</p>
          <h3 className="text-2xl font-bold text-slate-800">
            Rp {totalIncome.toLocaleString('id-ID')}
          </h3>
        </div>
        {onReset && (
            <button 
                onClick={onReset}
                className="absolute top-3 right-3 text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100"
                title="Reset Statistik Pemasukan"
            >
                <RotateCcw size={16} />
            </button>
        )}
      </div>

      <div className={cardClass}>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
          <TrendingUp size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">{dateLabel || "Pemasukan Hari Ini"}</p>
          <h3 className="text-2xl font-bold text-slate-800">
            Rp {todayIncome.toLocaleString('id-ID')}
          </h3>
        </div>
      </div>

      <div className={cardClass}>
        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
          <ShoppingBag size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Total Transaksi</p>
          <h3 className="text-2xl font-bold text-slate-800">
            {transactionCount}
          </h3>
        </div>
      </div>
    </div>
  );
}
