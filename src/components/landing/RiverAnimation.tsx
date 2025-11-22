import React from 'react';

export const RiverAnimation = () => {
    return (
        <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-green-50">

            {/* Sun */}
            <div className="absolute top-10 right-10 w-24 h-24 bg-yellow-300 rounded-full shadow-[0_0_60px_rgba(253,224,71,0.6)] animate-pulse-slow">
                <div className="absolute inset-0 bg-yellow-200 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }} />
            </div>

            {/* Clouds */}
            <div className="absolute top-20 left-10 w-32 h-12 bg-white/80 rounded-full blur-md animate-float-slow opacity-80" />
            <div className="absolute top-32 left-1/2 w-40 h-14 bg-white/60 rounded-full blur-md animate-float-medium opacity-70" />
            <div className="absolute top-16 right-1/3 w-24 h-10 bg-white/70 rounded-full blur-md animate-float-fast opacity-60" />

            {/* Mountains */}
            <div className="absolute bottom-1/3 left-0 w-full h-1/2 flex items-end justify-center opacity-80">
                <div className="w-0 h-0 border-l-[150px] border-r-[150px] border-b-[250px] border-l-transparent border-r-transparent border-b-emerald-800/20 transform -translate-x-20" />
                <div className="w-0 h-0 border-l-[200px] border-r-[200px] border-b-[350px] border-l-transparent border-r-transparent border-b-emerald-900/20 transform translate-x-10 z-10" />
                <div className="w-0 h-0 border-l-[100px] border-r-[100px] border-b-[180px] border-l-transparent border-r-transparent border-b-emerald-700/20 transform translate-x-32" />
            </div>

            {/* Grass Banks */}
            <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-emerald-100 to-emerald-50 transform skew-y-3 origin-bottom-left scale-110" />
            <div className="absolute bottom-0 w-full h-1/4 bg-gradient-to-t from-emerald-200 to-emerald-100 transform -skew-y-2 origin-bottom-right scale-110 opacity-80" />

            {/* River */}
            <div className="absolute bottom-0 w-full h-1/4 overflow-hidden">
                <div className="absolute inset-0 bg-blue-400/30 animate-wave-1 transform scale-110" />
                <div className="absolute inset-0 bg-blue-500/20 animate-wave-2 transform scale-125 translate-y-2" />
                <div className="absolute inset-0 bg-blue-300/40 animate-wave-3 transform scale-150 translate-y-4" />

                {/* Sparkles on water */}
                {[...Array(10)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full animate-twinkle"
                        style={{
                            width: Math.random() * 4 + 2 + 'px',
                            height: Math.random() * 4 + 2 + 'px',
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                            animationDelay: Math.random() * 2 + 's',
                            opacity: 0.6
                        }}
                    />
                ))}
            </div>

            {/* Tree Silhouette (Optional, minimal) */}
            <div className="absolute bottom-10 left-10 w-4 h-32 bg-emerald-900/10 rounded-full transform -rotate-2">
                <div className="absolute -top-10 -left-10 w-24 h-24 bg-emerald-800/10 rounded-full" />
                <div className="absolute -top-16 left-2 w-20 h-20 bg-emerald-800/10 rounded-full" />
            </div>

            <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(20px); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-30px); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(15px); }
        }
        @keyframes wave-1 {
          0% { transform: translateX(0) scale(1.1); }
          50% { transform: translateX(-2%) scale(1.15); }
          100% { transform: translateX(0) scale(1.1); }
        }
        @keyframes wave-2 {
          0% { transform: translateX(0) scale(1.25) translateY(8px); }
          50% { transform: translateX(2%) scale(1.2) translateY(8px); }
          100% { transform: translateX(0) scale(1.25) translateY(8px); }
        }
        @keyframes wave-3 {
          0% { transform: translateX(0) scale(1.5) translateY(16px); }
          50% { transform: translateX(-1%) scale(1.55) translateY(16px); }
          100% { transform: translateX(0) scale(1.5) translateY(16px); }
        }
        @keyframes pulse-slow {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes twinkle {
            0%, 100% { opacity: 0; transform: scale(0.5); }
            50% { opacity: 0.8; transform: scale(1); }
        }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 8s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 6s ease-in-out infinite; }
        .animate-wave-1 { animation: wave-1 5s ease-in-out infinite; }
        .animate-wave-2 { animation: wave-2 7s ease-in-out infinite; }
        .animate-wave-3 { animation: wave-3 6s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
      `}</style>
        </div>
    );
};
