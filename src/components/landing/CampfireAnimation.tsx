import React from 'react';

export const CampfireAnimation = () => {
    return (
        <div className="relative w-full h-full overflow-hidden bg-[#0f0f1a]">
            {/* Starry Sky */}
            <div className="absolute inset-0 opacity-80">
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-white animate-twinkle"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 3 + 1}px`,
                            height: `${Math.random() * 3 + 1}px`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${Math.random() * 3 + 2}s`,
                        }}
                    />
                ))}
            </div>

            {/* Moon */}
            <div className="absolute top-10 right-10 w-24 h-24 rounded-full bg-yellow-100/20 blur-xl animate-pulse-slow" />
            <div className="absolute top-12 right-12 w-20 h-20 rounded-full bg-yellow-50/90 shadow-[0_0_50px_rgba(255,255,200,0.4)]" />

            {/* Ground */}
            <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-[#050508] to-[#1a1a2e]" />

            {/* Campfire Container */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex flex-col items-center">

                {/* Flames */}
                <div className="relative w-40 h-40 mb-[-20px]">
                    {/* Flame layers */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-orange-500 rounded-tl-[80%] rounded-tr-[80%] rounded-bl-[20%] rounded-br-[20%] rotate-45 animate-flame-1 blur-sm opacity-80 mix-blend-screen origin-bottom" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-red-500 rounded-tl-[80%] rounded-tr-[80%] rounded-bl-[20%] rounded-br-[20%] rotate-45 animate-flame-2 blur-md opacity-70 mix-blend-screen origin-bottom" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-yellow-400 rounded-tl-[80%] rounded-tr-[80%] rounded-bl-[20%] rounded-br-[20%] rotate-45 animate-flame-3 blur-sm opacity-90 mix-blend-screen origin-bottom" />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full animate-flicker blur-md opacity-60 mix-blend-screen" />

                    {/* Sparks */}
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={`spark-${i}`}
                            className="absolute bottom-4 left-1/2 w-1 h-1 bg-yellow-200 rounded-full animate-spark"
                            style={{
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${1 + Math.random()}s`,
                                transform: `translateX(${Math.random() * 40 - 20}px)`
                            }}
                        />
                    ))}
                </div>

                {/* Logs */}
                <div className="relative w-32 h-10">
                    <div className="absolute bottom-0 left-2 w-28 h-6 bg-[#4a3728] rounded-full transform rotate-12 shadow-lg" />
                    <div className="absolute bottom-0 right-2 w-28 h-6 bg-[#3e2d20] rounded-full transform -rotate-12 shadow-lg" />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#2c1e14] rounded-full shadow-inner" />
                </div>

                {/* Glow on ground */}
                <div className="absolute -bottom-10 w-60 h-20 bg-orange-900/30 blur-2xl rounded-full animate-pulse-glow" />
            </div>

            <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes flame-1 {
          0%, 100% { transform: translateX(-50%) scale(1) rotate(-45deg); border-radius: 80% 80% 20% 20%; }
          50% { transform: translateX(-50%) scale(1.1) rotate(-42deg); border-radius: 80% 90% 20% 20%; }
        }
        @keyframes flame-2 {
          0%, 100% { transform: translateX(-50%) scale(0.9) rotate(-45deg); }
          50% { transform: translateX(-50%) scale(1.0) rotate(-48deg); height: 110%; }
        }
        @keyframes flame-3 {
          0%, 100% { transform: translateX(-50%) scale(0.8) rotate(-45deg); }
          25% { transform: translateX(-52%) scale(0.85) rotate(-43deg); }
          50% { transform: translateX(-48%) scale(0.8) rotate(-47deg); }
          75% { transform: translateX(-50%) scale(0.85) rotate(-45deg); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.8; transform: translateX(-50%) scale(1.2); }
        }
        @keyframes spark {
            0% { opacity: 1; transform: translate(-50%, 0) scale(1); }
            100% { opacity: 0; transform: translate(calc(-50% + ${Math.random() * 40 - 20}px), -100px) scale(0); }
        }
        @keyframes pulse-slow {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(1.1); }
        }
        @keyframes pulse-glow {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
        }
        .animate-twinkle { animation: twinkle linear infinite; }
        .animate-flame-1 { animation: flame-1 3s ease-in-out infinite; }
        .animate-flame-2 { animation: flame-2 2s ease-in-out infinite; }
        .animate-flame-3 { animation: flame-3 1.5s ease-in-out infinite; }
        .animate-flicker { animation: flicker 0.2s ease-in-out infinite; }
        .animate-spark { animation: spark linear infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
      `}</style>
        </div>
    );
};
