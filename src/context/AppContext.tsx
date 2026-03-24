import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Participant {
  id: string;
  name: string;
  phoneNumber: string;
  prize: string;
  createdAt: string;
  expiresAt?: string;
  status: 'pending' | 'used';
}

interface UserData {
  id: string;
  name: string;
  phoneNumber: string;
}

interface AppContextType {
  userData: UserData | null;
  setUserData: (data: UserData | null) => void;
  isAuthReady: boolean;
  authError: string | null;
  saveParticipant: (participant: Participant) => void;
  getParticipants: () => Participant[];
  updateParticipantStatus: (id: string, status: 'pending' | 'used') => void;
  checkAlreadyParticipated: (phone: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  // No longer need auth ready state, but keeping it to avoid breaking other components immediately
  const [isAuthReady, setIsAuthReady] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Remove specific test number from localStorage
    const data = localStorage.getItem('roulette_participants');
    if (data) {
      try {
        let participants = JSON.parse(data);
        const filtered = participants.filter((p: any) => 
          p.phoneNumber !== '010-6562-3021' && p.phoneNumber !== '01065623021'
        );
        if (filtered.length !== participants.length) {
          localStorage.setItem('roulette_participants', JSON.stringify(filtered));
        }
      } catch (e) {
        console.error('Error parsing participants', e);
      }
    }
  }, []);

  const getParticipants = (): Participant[] => {
    const data = localStorage.getItem('roulette_participants');
    return data ? JSON.parse(data) : [];
  };

  const saveParticipant = (participant: Participant) => {
    const participants = getParticipants();
    
    if (participant.prize === '') {
      // For initial entry, overwrite any existing entry for this phone that hasn't spun yet
      const existingEmptyIndex = participants.findIndex(p => p.phoneNumber === participant.phoneNumber && p.prize === '');
      if (existingEmptyIndex >= 0) {
        participants[existingEmptyIndex] = participant;
      } else {
        participants.push(participant);
      }
    } else {
      // For completed spin, update by ID
      const existingIndex = participants.findIndex(p => p.id === participant.id);
      if (existingIndex >= 0) {
        participants[existingIndex] = participant;
      } else {
        // Fallback
        const fallbackIndex = participants.findIndex(p => p.phoneNumber === participant.phoneNumber && p.prize === '');
        if (fallbackIndex >= 0) {
          participants[fallbackIndex] = participant;
        } else {
          participants.push(participant);
        }
      }
    }
    
    localStorage.setItem('roulette_participants', JSON.stringify(participants));
  };

  const updateParticipantStatus = (id: string, status: 'pending' | 'used') => {
    const participants = getParticipants();
    const updated = participants.map(p => p.id === id ? { ...p, status } : p);
    localStorage.setItem('roulette_participants', JSON.stringify(updated));
  };

  const checkAlreadyParticipated = (phone: string): boolean => {
    if (phone === '010-6562-3021' || phone === '01065623021') return false;
    const participants = getParticipants();
    return participants.some(p => p.phoneNumber === phone && p.prize !== '');
  };

  return (
    <AppContext.Provider value={{ 
      userData, 
      setUserData, 
      isAuthReady, 
      authError,
      saveParticipant,
      getParticipants,
      updateParticipantStatus,
      checkAlreadyParticipated
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
