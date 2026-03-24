import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const LandingPage = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUserData, isAuthReady, authError, checkAlreadyParticipated, saveParticipant } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authError) {
      setError(authError);
      return;
    }
    if (!isAuthReady) {
      setError('잠시만 기다려주세요. 초기화 중입니다...');
      return;
    }
    if (!name || !phone || !consent) {
      setError('모든 항목을 입력하고 약관에 동의해주세요.');
      return;
    }
    
    // Basic phone validation (digits only, 10-11 chars)
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      setError('올바른 전화번호를 입력해주세요 (예: 01012345678).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      if (checkAlreadyParticipated(cleanPhone)) {
        setError('이미 참여하셨습니다!');
        setLoading(false);
        return;
      }

      // Save user data to context
      const newId = uuidv4();
      setUserData({ id: newId, name, phoneNumber: cleanPhone });
      
      // Save initial participant data to DB
      saveParticipant({
        id: newId,
        name,
        phoneNumber: cleanPhone,
        prize: '',
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      
      navigate('/roulette');
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-orange-100 p-4 rounded-full">
            <Gift className="w-12 h-12 text-orange-500" />
          </div>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2 tracking-tight">
          이정 제육에서 드리는 선물!
        </h1>
        <p className="text-center text-gray-500 mb-8">
          룰렛 돌리고 받아가세요.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              placeholder="이름을 입력해주세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전화번호 (해당 번호로 쿠폰이 발송됩니다)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              placeholder="01012345678"
              required
            />
          </div>

          <div className="flex items-start gap-3 mt-6">
            <div className="flex items-center h-5">
              <input
                id="consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                required
              />
            </div>
            <label htmlFor="consent" className="text-sm text-gray-600">
              이벤트 참여 및 마케팅 목적의 개인정보 수집 및 이용에 동의합니다.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !name || !phone || !consent}
            className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-colors mt-8 shadow-lg shadow-orange-500/30"
          >
            {loading ? '처리 중...' : '룰렛 돌리기!'}
          </button>
        </form>
      </motion.div>
      <button 
        onClick={() => navigate('/admin')}
        className="mt-8 text-xs text-gray-400 hover:text-gray-600 transition-colors opacity-50"
      >
        관리자 페이지
      </button>
    </div>
  );
};
