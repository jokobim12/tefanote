import { useState, useRef, useEffect } from 'react';
import { Plus, ShoppingCart, Loader2, User, Tag, Calculator, Printer, Package, Globe, Check, Trash, Save, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TransactionForm({ onAddTransaction, items = [] }) {
  // State Global Sesi
  const [customerName, setCustomerName] = useState('');
  
  // State Form Item
  const [formData, setFormData] = useState({
    itemName: '',
    price: '',
    qty: 1,
    type: 'print',
  });
  
  // State Cart
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(null);
  
  const cartEndRef = useRef(null);

  // Auto scroll to bottom of cart when item added
  useEffect(() => {
    if (cart.length > 0 && cartEndRef.current) {
        cartEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [cart]);

  const handlePresetClick = (item, index) => {
    setSelectedPresetIndex(index);
    setFormData(prev => ({
      ...prev,
      itemName: item.name,
      price: item.price,
      type: item.type,
      qty: 1 
    }));
  };

  const getIcon = (type) => {
    switch(type) {
      case 'print': return <Printer size={14} />;
      case 'service': return <Globe size={14} />;
      default: return <Package size={14} />;
    }
  };

  const addToCart = (e) => {
    e.preventDefault();
    if (!formData.itemName || !formData.price) {
      toast.error("Isi data barang & harga!");
      return;
    }

    const newItem = {
      id: crypto.randomUUID(),
      ...formData,
      price: Number(formData.price),
      qty: Number(formData.qty),
      total: Number(formData.price) * Number(formData.qty),
      date: new Date().toISOString()
    };

    setCart(prev => [...prev, newItem]);
    setFormData({ itemName: '', price: '', qty: 1, type: 'print' });
    setSelectedPresetIndex(null);
    toast.success("Masuk keranjang");
  };

  const removeFromCart = (tempId) => {
    setCart(prev => prev.filter(item => item.id !== tempId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Keranjang kosong!");
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 600));

    const totalTransactionPrice = cart.reduce((acc, curr) => acc + curr.total, 0);
    
    const newTransactionGroup = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      customerName: customerName || '-',
      items: cart,
      totalPrice: totalTransactionPrice,
      type: 'group'
    };

    onAddTransaction(newTransactionGroup);
    toast.success("Transaksi disimpan!");

    setCart([]);
    setCustomerName('');
    setIsSubmitting(false);
  };

  const totalCartPrice = cart.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-120px)] sticky top-24">
      
      {/* 1. Header & Customer - Fixed Top */}
      <div className="bg-slate-50 p-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm">
                <ShoppingCart size={16} />
            </div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Input Transaksi</h2>
            {cart.length > 0 && (
                <span className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    {cart.length} Item
                </span>
            )}
        </div>
        <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
            type="text"
            placeholder="Nama Pelanggan (Opsional)"
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-300 focus:ring-1 focus:ring-blue-500 text-sm"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            />
        </div>
      </div>

      {/* 2. Scrollable Content Area */}
      <div className="overflow-y-auto p-3 space-y-4 flex-1 custom-scrollbar">
        
        {/* Horizontal Scroll Presets */}
        <div>
          <div className="flex justify-between items-center mb-1.5 ">
             <label className="text-[10px] font-bold text-slate-400 uppercase">Menu Cepat</label>
             <div className="text-[10px] text-slate-400 flex items-center gap-1 animate-pulse">
                Geser <ChevronRight size={10} />
             </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x custom-scrollbar">
            {items.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetClick(item, idx)}
                className={`
                  flex-none w-28 p-2 rounded-lg border text-left transition-all snap-start flex flex-col h-[72px] relative
                  ${selectedPresetIndex === idx 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-100' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                  }
                `}
              >
                <div className="flex justify-between items-start mb-1 w-full">
                    <span className={selectedPresetIndex === idx ? 'text-blue-200' : 'text-slate-400'}>
                        {getIcon(item.type)}
                    </span>
                    {selectedPresetIndex === idx && <Check size={12} className="absolute top-2 right-2" />}
                </div>
                <div className="font-medium text-[10px] leading-tight mb-auto line-clamp-2">{item.name}</div>
                <div className={`text-[10px] font-mono mt-1 ${selectedPresetIndex === idx ? 'text-blue-100' : 'text-slate-500'}`}>
                  Rp {item.price.toLocaleString('id-ID')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Compact Input Form */}
        <form onSubmit={addToCart} className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
            <div className="mb-2">
                <input
                type="text"
                required
                placeholder="Nama Item..."
                className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:border-blue-500 font-medium"
                value={formData.itemName}
                onChange={e => {
                    setFormData({...formData, itemName: e.target.value});
                    setSelectedPresetIndex(null);
                }}
                />
            </div>
            <div className="flex gap-2">
                <div className="w-1/3">
                    <input
                        type="number"
                        required
                        min="0"
                        placeholder="Harga"
                        className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:border-blue-500"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                    />
                </div>
                <div className="w-1/4">
                    <input
                        type="number"
                        required
                        min="1"
                        placeholder="Qty"
                        className="w-full px-2 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:border-blue-500 text-center font-bold"
                        value={formData.qty}
                        onChange={e => setFormData({...formData, qty: e.target.value})}
                    />
                </div>
                <button
                    type="submit"
                    className="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-transform active:scale-95"
                >
                    <Plus size={14} /> Tambah
                </button>
            </div>
            <div className="text-[10px] text-slate-400 text-right mt-1 italic">
                 {(() => {
                     const name = formData.itemName.toLowerCase();
                     if (formData.type === 'service' || name.includes('jasa') || name.includes('web') || name.includes('install')) return 'Satuan: Proyek/Jasa';
                     if (name.includes('paket') || name.includes('box') || name.includes('klip')) return 'Satuan: Paket/Box';
                     if (name.includes('kertas') || name.includes('print') || name.includes('fc') || name.includes('lembar')) return 'Satuan: Lembar';
                     return 'Satuan: Pcs/Unit';
                 })()}
            </div>
        </form>

        {/* Cart List */}
        {cart.length > 0 && (
            <div className="border-t border-slate-100 pt-2">
                 <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Isi Keranjang</div>
                 <div className="space-y-1.5">
                    {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded border border-slate-100 group">
                            <div className="overflow-hidden">
                                <div className="font-medium text-slate-700 truncate">{item.itemName}</div>
                                <div className="text-[10px] text-slate-500">{item.qty} x {item.price.toLocaleString('id-ID')}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="font-bold text-slate-700">{item.total.toLocaleString('id-ID')}</span>
                                <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                    <div ref={cartEndRef} />
                 </div>
            </div>
        )}
      </div>

      {/* 3. Footer Actions - Sticky Bottom */}
      {cart.length > 0 && (
        <div className="bg-white border-t border-slate-200 p-3 shrink-0 shadow-[0_-5px_10px_rgba(0,0,0,0.02)] z-10">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-slate-500">Total</span>
                <span className="text-lg font-bold text-blue-700">Rp {totalCartPrice.toLocaleString('id-ID')}</span>
            </div>
            <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 transition-all active:scale-[0.98] text-sm"
            >
                 {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                 Simpan Transaksi
            </button>
        </div>
      )}
    </div>
  );
}
