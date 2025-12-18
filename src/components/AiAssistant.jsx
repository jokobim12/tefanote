import { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ReactMarkdown from 'react-markdown';
import { Bot, Send, X, MessageCircle, Loader2, Sparkles, ChevronDown, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AiAssistant({ apiKey, transactions, stats, todayIncome }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useLocalStorage('tefanote_chat_history', [
    { role: 'model', text: 'Halo kakak! Saya asisten keuangan TefaNote. Ada yang bisa saya bantu analisis hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const generateContext = () => {
    const totalTransactions = transactions.length;
    const topItems = {};
    transactions.forEach(t => {
        if(t.items && Array.isArray(t.items)) {
            t.items.forEach(i => {
                topItems[i.itemName] = (topItems[i.itemName] || 0) + i.qty;
            });
        } else {
             topItems[t.itemName] = (topItems[t.itemName] || 0) + t.qty;
        }
    });

    const sortedItems = Object.entries(topItems)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, qty]) => `- ${name} (${qty})`)
        .join('\n');

    return `
      DATA KEUANGAN SAAT INI:
      - Total Pemasukan: Rp ${stats.totalIncome.toLocaleString('id-ID')}
      - Pemasukan Hari Ini: Rp ${todayIncome.toLocaleString('id-ID')}
      - Total Transaksi: ${stats.transactionCount}
      - 5 Produk Terlaris:
      ${sortedItems}
      
      PANDUAN FITUR APLIKASI TEFANOTE (KNOWLEDGE BASE):
      Gunakan informasi ini jika user bertanya cara menggunakan aplikasi:

      1. **Menambah/Mengatur Produk (Preset)**:
         - Caranya: Klik ikon **Gear/Gerigi** (Pengaturan) di pojok kanan atas layar.
         - Di sana bisa: Tambah produk baru, hapus produk lama, dan atur API Key AI.
      
      2. **Mencatat Transaksi**:
         - Caranya: Cukup klik tombol produk di bagian "Menu Cepat" (kiri), ATAU ketik manual Nama & Harga lalu klik "Simpan".
      
      3. **Cetak Laporan / Struk**:
         - Caranya: Klik tombol merah **"Download Laporan (PDF)"** di bagian bawah.
         - PDF berisi ringkasan pemasukan dan tabel detail transaksi.
      
      4. **Melihat Riwayat Harian Lain (Filter Tanggal)**:
         - Caranya: Klik tombol **Tanggal** (ikon Kalender) di pojok kanan atas (Desktop) atau baris bawah (Mobile).
         - Pilih tanggal yang diinginkan untuk melihat history masa lalu.
      
      5. **Edit / Hapus Transaksi**:
         - Edit: Klik ikon **Pensil Kuning** di tabel transaksi.
         - Hapus: Klik ikon **Tong Sampah Merah** di tabel transaksi.
      
      6. **Reset/Hapus Semua Data**:
         - Caranya: Klik tombol "Reset" (ikon putar balik) di kartu statistik Pemasukan Hari Ini jika ingin mulai dari nol.

      PERAN DAN INSTRUKSI:
      Anda adalah "TefaNote Advisor", konsultan bisnis digital sekaligus **Pemandu Aplikasi** yang cerdas.
      
      Tugas Anda:
      1. Jika user bertanya data/analisis: Lakukan analisis mendalam seperti instruksi sebelumnya.
      2. **(BARU) Jika user bertanya CARA/FITUR**: Jawablah dengan memandu mereka menekan tombol yang tepat sesuai Knowledge Base di atas. Jawab dengan jelas dan membantu.
      
      3. Format Jawaban:
         - Gunakan Markdown (**Bold** untuk nama tombol/menu penting).
         - Gunakan List jika langkah-langkahnya perlu urutan.
      
      4. Gaya Bahasa: Bahasa Indonesia profesional, ramah, dan solutif.
      
      CONTOH JAWABAN (JIKA DITANYA CARA):
      "Untuk menambah produk baru gampang banget, Kak! ikuti langkah ini:
      1. Klik ikon **Gear ⚙️** (Pengaturan) di pojok kanan atas.
      2. Masukkan nama dan harga produk.
      3. Klik tombol **Tambah**."
    `;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    if (!apiKey) {
        toast.error("Masukkan API Key Gemini di menu Settings dulu ya!");
        setMessages(prev => [...prev, { role: 'model', text: 'Tolong atur API Key Gemini dulu di menu Settings (ikon gear) di pojok kiri atas ya. 😅' }]);
        setInput('');
        return;
    }

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    // Dynamic Model Discovery Strategy
    try {
        const prompt = `System: ${generateContext()}\nUser: ${input}`;
        
        // 1. Discover available models strategies
        let availableModels = [];
        try {
            const modelsReq = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
            if (modelsReq.ok) {
                const modelsData = await modelsReq.json();
                availableModels = modelsData.models?.filter(m => 
                    m.supportedGenerationMethods?.includes("generateContent")
                ) || [];
            } else {
                console.warn("ListModels failed, using fallback.");
            }
        } catch (e) {
            console.warn("Auto-discovery error:", e);
        }

        // FALLBACK: If discovery failed or returned no models, use hardcoded defaults
        if (availableModels.length === 0) {
            availableModels = [
                { name: 'models/gemini-1.5-flash' },
                { name: 'models/gemini-1.5-flash-001' },
                { name: 'models/gemini-1.5-pro' },
                { name: 'models/gemini-pro' }
            ];
        }

        // Prioritize known stable models
        const getPriority = (name) => {
            if (name.includes('gemini-1.5-flash')) return 0;
            if (name.includes('gemini-1.5-pro')) return 1;
            if (name.includes('gemini-pro')) return 2;
            return 99;
        };

        availableModels.sort((a, b) => getPriority(a.name) - getPriority(b.name));

        // Try models sequentially until one works
        let success = false;
        let lastError = null;

        for (const model of availableModels) {
            try {
                // console.log("Trying model:", model.name);
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model.name}:generateContent?key=${apiKey.trim()}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    // If quota exceeded or not found, try next model
                    const errMsg = data.error?.message || response.statusText;
                    if (response.status === 429 || response.status === 404 || errMsg.includes('quota')) {
                        console.warn(`Model ${model.name} failed: ${errMsg}`);
                        lastError = new Error(`Model ${model.name}: ${errMsg}`);
                        continue; 
                    }
                    throw new Error(errMsg);
                }

                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                     setMessages(prev => [...prev, { role: 'model', text: text }]);
                     success = true;
                     break; 
                }
            } catch (err) {
                lastError = err;
            }
        }

        if (!success) {
            throw lastError || new Error("Semua model AI menolak akses (Kuota/Error).");
        }

    } catch (error) {
        console.error("AI Error:", error);
        let errorMessage = "Koneksi ke Gemini gagal.";
        if (error.message.includes("API key")) errorMessage = "API Key belum diisi atau salah.";
        if (error.message.includes("Failed to fetch")) errorMessage = "Koneksi internet bermasalah.";
        if (error.message.includes("404")) errorMessage = "Model AI tidak ditemukan.";
        if (error.message.includes("quota") || error.message.includes("429")) errorMessage = "Kuota API Key Anda habis. Silakan buat Key baru yang fresh.";
        
        setMessages(prev => [...prev, { role: 'model', text: `Maaf, saya sedang pusing. 😵\nMasalah: ${errorMessage}\n\nDetail: ${error.message}` }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      {/* TRIGGER BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center
          ${isOpen ? 'bg-slate-200 text-slate-600 rotate-90' : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white animate-bounce-slow'}
        `}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </button>

      {/* CHAT WINDOW */}
      <div className={`fixed bottom-24 right-4 md:right-6 w-[90vw] md:w-[350px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-40 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right
         ${isOpen ? 'scale-100 opacity-100 translate-y-0 h-[500px]' : 'scale-50 opacity-0 translate-y-10 h-0 pointer-events-none'}
      `}>
         {/* Header */}
         <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center gap-3 shrink-0">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Bot size={20} className="text-white" />
            </div>
            <div>
                <h3 className="font-bold text-white text-sm">TefaNote AI</h3>
                <p className="text-blue-100 text-[10px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                </p>
            </div>
            <div className="ml-auto flex items-center gap-1">
                <button 
                    onClick={() => {
                        if(confirm('Hapus riwayat chat?')) {
                            setMessages([{ role: 'model', text: 'Halo! Saya asisten keuangan TefaNote. Ada yang bisa saya bantu analisis hari ini?' }]);
                        }
                    }} 
                    className="text-blue-100 hover:text-white p-1 rounded hover:bg-white/10"
                    title="Hapus Chat"
                >
                    <Trash2 size={16}/>
                </button>
                <button onClick={() => setIsOpen(false)} className="text-blue-100 hover:text-white p-1 rounded hover:bg-white/10"><ChevronDown size={20}/></button>
            </div>
         </div>

         {/* Messages Area */}
         <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                    }`}>
                        <ReactMarkdown 
                            components={{
                                ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
                                p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold underline decoration-blue-300 decoration-2 underline-offset-2" {...props} />,
                            }}
                        >
                            {msg.text}
                        </ReactMarkdown>
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 rounded-2xl p-3 rounded-bl-none flex gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                    </div>
                </div>
            )}
            <div ref={chatEndRef} />
         </div>

         {/* Input Area */}
         <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 shrink-0 flex gap-2">
            <input 
                type="text" 
                placeholder="Tanyakan Sesuatu" 
                className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner"
                value={input}
                onChange={e => setInput(e.target.value)}
            />
            <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:scale-95 transition-all shadow-md active:scale-90"
            >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
            </button>
         </form>
      </div>
    </>
  );
}
