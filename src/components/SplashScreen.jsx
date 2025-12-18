import { NotebookPen, Loader2 } from 'lucide-react';

export default function SplashScreen({ isLoading }) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center animate-out fade-out duration-700 delay-500 fill-mode-forwards">
      <div className="relative mb-6">
         {/* Background decoration */}
         <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl animate-pulse -z-10 scale-150"></div>
         
         {/* Main Icon */}
         <div className="bg-gradient-to-tr from-blue-600 to-blue-400 p-6 rounded-2xl shadow-xl shadow-blue-200 animate-in zoom-in duration-500">
            <NotebookPen size={64} className="text-white" />
         </div>
      </div>

      <div className="text-center space-y-2 animate-in slide-in-from-bottom-4 duration-700 delay-100">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent tracking-tight">
            TefaNote
        </h1>
        <p className="text-sm text-slate-400 font-medium">
            Financial Assistant
        </p>
      </div>

      {/* Loading Indicator */}
      <div className="mt-12">
        <Loader2 size={24} className="text-blue-500 animate-spin opacity-50" />
      </div>
    
      <div className="absolute bottom-8 text-xs text-slate-300 font-medium pb-4">
        Powered by Jokobim
      </div>
    </div>
  );
}
