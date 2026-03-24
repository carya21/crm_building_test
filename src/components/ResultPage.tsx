import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Ticket, MessageSquare, AlertCircle, Home } from 'lucide-react';
import { format, addDays } from 'date-fns';

export const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useAppContext();
  
  const prize = location.state?.prize;
  const couponId = location.state?.couponId;

  useEffect(() => {
    if (!userData || !prize || !couponId) {
      navigate('/');
    }
  }, [userData, prize, couponId, navigate]);

  if (!userData || !prize || !couponId) return null;

  const [isSending, setIsSending] = useState(false);

  // Calculate dates
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const expiryDate = addDays(today, 30);
  
  const formattedTomorrow = format(tomorrow, 'yyyy.MM.dd');
  const formattedExpiry = format(expiryDate, 'yyyy.MM.dd');

  const handleSendSMS = async () => {
    if (isSending) return;
    
    const message = `[이정제육 룰렛 당첨]\n${userData.name}님, 축하합니다!\n\n1. 당첨혜택 : ${prize}\n2. 쿠폰 번호 : ${couponId.split('-')[0]}\n3. 쿠폰 유효기간 : ${formattedTomorrow} ~ ${formattedExpiry}`;
    
    setIsSending(true);
    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userData.phoneNumber,
          content: message,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('고객님께 문자가 성공적으로 발송되었습니다!');
      } else {
        alert(`문자 발송 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('SMS Error:', error);
      alert('문자 발송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden"
      >
        {/* Decorative background circles */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-orange-100 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-yellow-100 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="bg-orange-100 p-5 rounded-full">
              <Ticket className="w-16 h-16 text-orange-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">축하합니다, {userData.name}님!</h2>
          <p className="text-gray-500 mb-8">다음 방문 시 사용할 수 있는 특별한 혜택에 당첨되셨습니다.</p>

          <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-6 text-white shadow-lg mb-8 transform -rotate-1">
            <p className="text-sm font-medium opacity-80 mb-1">당첨 혜택</p>
            <h3 className="text-3xl font-extrabold mb-4">{prize}</h3>
            
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm mb-3">
              <p className="text-xs uppercase tracking-wider opacity-80 mb-1">쿠폰 번호</p>
              <p className="font-mono text-sm break-all">{couponId}</p>
            </div>

            <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider opacity-80 mb-1">쿠폰 유효기간</p>
              <p className="font-medium text-sm">{formattedTomorrow} ~ {formattedExpiry}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center justify-center gap-2 text-orange-600 bg-orange-50 py-3 px-4 rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-medium text-sm break-keep">아래 '문자로 쿠폰 받기' 버튼을 눌러서 쿠폰 받기를 완료해 주세요</span>
            </div>
            
            <button 
              onClick={handleSendSMS}
              disabled={isSending}
              className={`flex items-center justify-center gap-2 text-white py-3 px-4 rounded-xl transition-colors shadow-md active:scale-95 ${
                isSending ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-900'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium text-sm">{isSending ? '전송 중...' : '문자로 쿠폰 받기'}</span>
            </button>

            <button 
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 text-gray-700 bg-gray-100 py-3 px-4 rounded-xl transition-colors hover:bg-gray-200 active:scale-95"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium text-sm">홈으로 돌아가기</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 flex flex-col gap-1.5 break-keep">
            <p className="font-bold text-red-500">[ 동일한 번호로 재 참여는 불가합니다. ]</p>
            <p>010-8295-3062라는 번호로 도착한 문자가 있어야 사용할 수 있습니다.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
