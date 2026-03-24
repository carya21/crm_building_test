import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { addDays } from 'date-fns';

const PRIZES = [
  { name: '우동사리 서비스', shortName: '우동사리\n서비스', probability: 0.30, color: '#FF6B6B' },
  { name: '음료 서비스', shortName: '음료\n서비스', probability: 0.25, color: '#4ECDC4' },
  { name: '꽝 (다음 기회에)', shortName: '꽝\n(다음기회)', probability: 0.20, color: '#45B7D1' },
  { name: '다음 방문 5,000원 할인', shortName: '5,000원\n할인', probability: 0.15, color: '#FDCB6E' },
  { name: '사장님과 사진 찍기', shortName: '사장님과\n사진찍기', probability: 0.10, color: '#6C5CE7' },
];

export const RoulettePage = () => {
  const { userData, saveParticipant } = useAppContext();
  const navigate = useNavigate();
  const [spinState, setSpinState] = useState<'idle' | 'spinning' | 'stopping'>('idle');
  const controls = useAnimation();
  const rotation = useMotionValue(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTickAngle = useRef(0);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playTick = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  const playWin = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.setValueAtTime(0.3, startTime + duration - 0.1);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    
    const now = ctx.currentTime;
    playNote(523.25, now, 0.15); // C5
    playNote(659.25, now + 0.15, 0.15); // E5
    playNote(783.99, now + 0.3, 0.15); // G5
    playNote(1046.50, now + 0.45, 0.4); // C6
  };

  const playLose = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 1);
  };

  useEffect(() => {
    const unsubscribe = rotation.on("change", (latest) => {
      if (latest - lastTickAngle.current >= 30) {
        playTick();
        lastTickAngle.current = latest;
      }
    });
    return () => unsubscribe();
  }, [rotation]);

  useEffect(() => {
    if (!userData) {
      navigate('/');
    }
  }, [userData, navigate]);

  const startSpin = async () => {
    if (spinState !== 'idle' || !userData) return;
    setSpinState('spinning');
    
    initAudio();

    lastTickAngle.current = rotation.get();

    // Spin very fast indefinitely (or for a long time)
    controls.start({
      rotate: rotation.get() + 360 * 50,
      transition: { duration: 15, ease: "linear" }
    });
  };

  const stopSpin = async () => {
    if (spinState !== 'spinning') return;
    setSpinState('stopping');

    controls.stop();
    const currentRot = rotation.get();

    // Determine prize based on probabilities
    const rand = Math.random();
    let cumulative = 0;
    let selectedPrizeIndex = 0;
    for (let i = 0; i < PRIZES.length; i++) {
      cumulative += PRIZES[i].probability;
      if (rand <= cumulative) {
        selectedPrizeIndex = i;
        break;
      }
    }

    // Calculate rotation
    const sliceAngle = 360 / PRIZES.length;
    // We want the selected prize to land at the top (0 degrees).
    const targetMod = 360 - (selectedPrizeIndex * sliceAngle + sliceAngle / 2);

    let extra_to_align = targetMod - (currentRot % 360);
    if (extra_to_align < 0) extra_to_align += 360;

    // Add 3 full spins for a dramatic slowdown
    const targetRotation = currentRot + 360 * 3 + extra_to_align;

    await controls.start({
      rotate: targetRotation,
      transition: { duration: 3.5, ease: [0.2, 0.8, 0.2, 1] }
    });

    try {
      const couponId = userData!.id;
      const selectedPrizeName = PRIZES[selectedPrizeIndex].name;

      if (selectedPrizeName === '꽝 (다음 기회에)') {
        playLose();
        setTimeout(() => {
          alert("아쉽게도 꽝입니다! 한 번 더 돌려보세요!");
          setSpinState('idle');
        }, 500);
        return;
      }

      playWin();

      // Save result to localStorage via context
      saveParticipant({
        id: couponId,
        name: userData!.name,
        phoneNumber: userData!.phoneNumber,
        prize: selectedPrizeName,
        createdAt: new Date().toISOString(),
        expiresAt: addDays(new Date(), 30).toISOString(),
        status: 'pending'
      });

      // Navigate to result page
      setTimeout(() => {
        navigate('/result', { state: { prize: selectedPrizeName, couponId } });
      }, 1000);

    } catch (error) {
      console.error(error);
      alert("결과를 저장하는 중 오류가 발생했습니다. 다시 시도해주세요.");
      setSpinState('idle');
    }
  };

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="text-center mb-12 relative z-10">
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight drop-shadow-lg">
          행운의 룰렛
        </h1>
        <p className="text-orange-200 font-medium text-lg drop-shadow">
          {spinState === 'idle' ? '버튼을 눌러 룰렛을 돌려보세요!' : spinState === 'spinning' ? '원할 때 멈춤 버튼을 누르세요!' : '결과를 확인하는 중...'}
        </p>
      </div>

      <div className="relative w-80 h-80 sm:w-96 sm:h-96 mb-12">
        {/* Pointer */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-30 drop-shadow-2xl">
          <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent border-t-red-600"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-red-500"></div>
        </div>

        {/* Outer Ring with Lights */}
        <div className="absolute inset-0 rounded-full border-[14px] border-gray-800 shadow-[0_0_40px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,0,0,0.8)] z-20 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = i * 15;
            const rad = (angle * Math.PI) / 180;
            const x = 50 + 48 * Math.sin(rad);
            const y = 50 - 48 * Math.cos(rad);
            return (
              <div
                key={i}
                className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full ${i % 2 === 0 ? 'bg-yellow-400' : 'bg-red-500'}`}
                style={{
                  top: `${y}%`,
                  left: `${x}%`,
                  boxShadow: `0 0 10px ${i % 2 === 0 ? '#facc15' : '#ef4444'}`,
                  animation: spinState === 'spinning' ? `pulse 0.5s infinite ${i % 2 === 0 ? '0s' : '0.25s'}` : 'none'
                }}
              />
            );
          })}
        </div>

        {/* Center Hub */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gray-900 rounded-full z-30 border-4 border-yellow-500 shadow-2xl flex items-center justify-center">
          <div className="w-6 h-6 bg-yellow-400 rounded-full shadow-[0_0_15px_#facc15]"></div>
        </div>

        {/* The Wheel */}
        <motion.div
          animate={controls}
          style={{ rotate: rotation }}
          className="w-full h-full rounded-full overflow-hidden shadow-inner relative z-10 border-4 border-gray-800"
        >
          <div 
            className="w-full h-full"
            style={{
              background: `conic-gradient(
                ${PRIZES.map((p, i) => `${p.color} ${i * (360 / PRIZES.length)}deg ${(i + 1) * (360 / PRIZES.length)}deg`).join(', ')}
              )`
            }}
          >
            {PRIZES.map((prize, index) => {
              const angle = 360 / PRIZES.length;
              const rot = index * angle + angle / 2;
              return (
                <div 
                  key={index}
                  className="absolute top-0 left-1/2 w-16 h-1/2 -ml-8 origin-bottom flex items-start justify-center pt-12"
                  style={{ transform: `rotate(${rot}deg)` }}
                >
                  <div 
                    className="text-white font-black text-base sm:text-lg text-center leading-tight whitespace-nowrap"
                    style={{ 
                      transform: 'rotate(90deg)',
                      transformOrigin: 'center',
                      textShadow: '1.5px 1.5px 0 #000, -1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 0px 4px 8px rgba(0,0,0,0.8)',
                      marginTop: '1.5rem'
                    }}
                  >
                    {prize.shortName.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {spinState === 'idle' ? (
        <button
          onClick={startSpin}
          className="w-full max-w-xs py-4 px-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl font-bold text-2xl transition-all transform active:scale-95 shadow-[0_0_30px_rgba(249,115,22,0.5)] border-2 border-orange-400/50 relative z-10"
        >
          돌리기!
        </button>
      ) : (
        <button
          onClick={stopSpin}
          disabled={spinState === 'stopping'}
          className={`w-full max-w-xs py-4 px-6 text-white rounded-2xl font-bold text-2xl transition-all transform active:scale-95 shadow-[0_0_30px_rgba(239,68,68,0.5)] border-2 border-red-400/50 relative z-10 ${
            spinState === 'stopping' 
              ? 'bg-gray-600 shadow-none border-gray-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 animate-pulse'
          }`}
        >
          {spinState === 'stopping' ? '결과 확인 중...' : '멈춤!'}
        </button>
      )}
    </div>
  );
};
