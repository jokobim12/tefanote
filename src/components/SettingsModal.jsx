import Modal from './Modal';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Save, X, RotateCcw, Package, Globe, Printer, Bot, Key } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsModal({ isOpen, onClose, items, onUpdateItems, onResetDefault, apiKey, onUpdateApiKey }) {
  const [newItem, setNewItem] = useState({ name: '', price: '', type: 'buy' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', type: 'buy' });

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price) {
        toast.error("Nama dan harga harus diisi!");
        return;
    }
    
    const itemToAdd = {
        id: crypto.randomUUID(),
        name: newItem.name,
        price: Number(newItem.price),
        type: newItem.type
    };

    onUpdateItems([...items, itemToAdd]);
    setNewItem({ name: '', price: '', type: 'buy' });
    toast.success("Item berhasil ditambahkan!");
  };

  const handleDelete = (id) => {
      onUpdateItems(items.filter(i => i.id !== id));
      toast.success("Item dihapus.");
  };

  const startEdit = (item) => {
      setEditingId(item.id);
      setEditForm({ ...item });
  };

  const saveEdit = () => {
      if (!editForm.name || !editForm.price) return;
      
      const updatedItems = items.map(i => i.id === editingId ? { ...editForm, price: Number(editForm.price) } : i);
      onUpdateItems(updatedItems);
      setEditingId(null);
      toast.success("Item diperbarui.");
  };

  const cancelEdit = () => {
      setEditingId(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pengaturan Produk" maxWidth="max-w-3xl">
      <div className="min-h-[400px] flex flex-col">
        {/* ADD ITEM FORM */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Tambah Produk Baru</h4>
            <div className="flex flex-col md:flex-row gap-3">
                <input 
                    type="text" 
                    placeholder="Nama Item..." 
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                />
                <input 
                    type="number" 
                    placeholder="Harga..." 
                    className="w-full md:w-32 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    value={newItem.price}
                    onChange={e => setNewItem({...newItem, price: e.target.value})}
                />
                <select 
                    className="w-full md:w-36 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                    value={newItem.type}
                    onChange={e => setNewItem({...newItem, type: e.target.value})}
                >
                    <option value="print">Print</option>
                    <option value="buy">Barang</option>
                    <option value="service">Jasa</option>
                </select>
                <button 
                    onClick={handleAddItem}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
                >
                    <Plus size={16} /> Tambah
                </button>
            </div>
        </div>

        {/* ITEMS LIST */}
        <div className="flex-1 overflow-y-auto max-h-[400px] border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold sticky top-0">
                    <tr>
                        <th className="p-3 border-b border-slate-200">Nama Item</th>
                        <th className="p-3 border-b border-slate-200 w-32">Harga</th>
                        <th className="p-3 border-b border-slate-200 w-24">Tipe</th>
                        <th className="p-3 border-b border-slate-200 w-24 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            {editingId === item.id ? (
                                // EDIT MODE
                                <>
                                    <td className="p-2">
                                        <input 
                                            autoFocus
                                            className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            value={editForm.name}
                                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input 
                                            type="number"
                                            className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            value={editForm.price}
                                            onChange={e => setEditForm({...editForm, price: e.target.value})}
                                        />
                                    </td>
                                    <td className="p-2">
                                         <select 
                                            className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none"
                                            value={editForm.type}
                                            onChange={e => setEditForm({...editForm, type: e.target.value})}
                                        >
                                            <option value="print">Print</option>
                                            <option value="buy"> Barang</option>
                                            <option value="service">Jasa</option>
                                        </select>
                                    </td>
                                    <td className="p-2 text-center">
                                        <div className="flex justify-center gap-1">
                                            <button onClick={saveEdit} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"><Save size={14}/></button>
                                            <button onClick={cancelEdit} className="p-1.5 bg-slate-100 text-slate-500 rounded hover:bg-slate-200"><X size={14}/></button>
                                        </div>
                                    </td>
                                </>
                            ) : (
                                // READ MODE
                                <>
                                    <td className="p-3 font-medium text-slate-700">{item.name}</td>
                                    <td className="p-3 font-mono text-slate-600">Rp {item.price.toLocaleString('id-ID')}</td>
                                    <td className="p-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                            ${item.type === 'print' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                              item.type === 'service' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                              'bg-emerald-50 text-emerald-600 border border-emerald-100'}
                                        `}>
                                            {item.type === 'print' ? <Printer size={10} /> : 
                                             item.type === 'service' ? <Globe size={10} /> : <Package size={10} />}
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => startEdit(item)} className="text-slate-400 hover:text-blue-600"><Pencil size={14}/></button>
                                            <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
                                        </div>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan="4" className="p-8 text-center text-slate-400">
                                Belum ada item produk. Tambahkan di atas.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* API KEY SECTION */}
        <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                <Bot size={14} /> Start AI Integration
            </h4>
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="password" 
                        placeholder="Tempel Gemini API Key di sini..." 
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        value={apiKey}
                        onChange={e => onUpdateApiKey(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                    className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50"
                >
                    Ambil Key Gratis
                </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
                *API Key disimpan secara lokal di browser Anda. Kami tidak mengirimnya ke server mana pun.
            </p>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
             <button 
                onClick={onResetDefault}
                className="text-xs text-red-500 hover:text-red-700 hover:underline flex items-center gap-1"
             >
                <RotateCcw size={12} /> Reset ke Default
             </button>
             <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors"
             >
                Selesai
             </button>
        </div>
      </div>
    </Modal>
  );
}
