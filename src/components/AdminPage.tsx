import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, Participant } from '../context/AppContext';
import { format } from 'date-fns';
import { Download, CheckCircle, XCircle, Home } from 'lucide-react';

export const AdminPage = () => {
  const navigate = useNavigate();
  const { getParticipants, updateParticipantStatus } = useAppContext();
  const [results, setResults] = useState<Participant[]>([]);

  useEffect(() => {
    // Load participants from local storage
    const loadData = () => {
      const data = getParticipants();
      // Sort by newest first
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setResults(data);
    };
    
    loadData();
    // Refresh every few seconds just in case
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [getParticipants]);

  const toggleUsed = (result: Participant) => {
    const newStatus = result.status === 'used' ? 'pending' : 'used';
    updateParticipantStatus(result.id, newStatus);
    // Optimistic update
    setResults(prev => prev.map(p => p.id === result.id ? { ...p, status: newStatus } : p));
  };

  const exportCSV = () => {
    const headers = ['참여 일시', '이름', '전화번호', '당첨 혜택', '쿠폰 번호', '쿠폰 마감일', '사용 여부'];
    const rows = results.map(r => [
      format(new Date(r.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      r.name,
      r.phoneNumber,
      r.prize || '참여 전',
      r.prize ? r.id.split('-')[0] : '-',
      r.expiresAt ? format(new Date(r.expiresAt), 'yyyy-MM-dd') : '-',
      !r.prize ? '-' : r.status === 'used' ? '사용 완료' : '미사용'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `이정제육_룰렛참여자_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
            <p className="text-gray-500 mt-1">
              현재 기기에서 수집된 룰렛 참여자 목록입니다. (로컬 저장소 사용)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <Home className="w-4 h-4" />
              홈으로
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <Download className="w-4 h-4" />
              CSV 다운로드
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-sm font-semibold text-gray-600">참여 일시</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">이름</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">전화번호</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">당첨 혜택</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">쿠폰 번호</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">쿠폰 마감일</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">상태</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">사용 처리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      아직 참여자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">
                        {format(new Date(result.createdAt), 'MM/dd HH:mm')}
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-900">
                        {result.name}
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-900">
                        {result.phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {result.prize ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {result.prize}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            참여 전
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm font-mono text-gray-500">
                        {result.prize ? result.id.split('-')[0] : '-'}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {result.expiresAt ? format(new Date(result.expiresAt), 'yyyy-MM-dd') : '-'}
                      </td>
                      <td className="p-4 text-sm">
                        {result.status === 'used' ? (
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <CheckCircle className="w-4 h-4" />
                            사용 완료
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-green-600 font-medium">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            미사용
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleUsed(result)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            result.status === 'used'
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                          }`}
                        >
                          {result.status === 'used' ? '취소' : '사용 완료'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
