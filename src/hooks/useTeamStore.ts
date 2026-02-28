import { useState, useEffect, useCallback } from 'react';
import type { MbtiType, Role } from '../utils/mbti';

const STORAGE_KEY = 'team-mbti-store';

export interface TeamMember {
  id: string;
  nickname: string;
  mbtiType: MbtiType;
  role: Role;
  addedAt: number;
}

export interface TeamStore {
  myType: MbtiType | null;
  myRole: Role;
  members: TeamMember[];
  analysisCount: number;
  aiCredits: number;
}

const initialStore: TeamStore = {
  myType: null,
  myRole: 'peer',
  members: [],
  analysisCount: 0,
  aiCredits: 0,
};

export function useTeamStore() {
  const [store, setStore] = useState<TeamStore>(initialStore);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as TeamStore;
        setStore(parsed);
      } catch {
        // ignore parse errors
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store, isLoaded]);

  const setMyType = useCallback((type: MbtiType) => {
    setStore(prev => ({ ...prev, myType: type }));
  }, []);

  const setMyRole = useCallback((role: Role) => {
    setStore(prev => ({ ...prev, myRole: role }));
  }, []);

  const addMember = useCallback((nickname: string, mbtiType: MbtiType, role: Role) => {
    setStore(prev => ({
      ...prev,
      members: [
        ...prev.members,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          nickname,
          mbtiType,
          role,
          addedAt: Date.now(),
        },
      ],
    }));
  }, []);

  const removeMember = useCallback((id: string) => {
    setStore(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== id),
    }));
  }, []);

  const updateMemberNickname = useCallback((id: string, nickname: string) => {
    setStore(prev => ({
      ...prev,
      members: prev.members.map(m =>
        m.id === id ? { ...m, nickname } : m
      ),
    }));
  }, []);

  const updateMember = useCallback((id: string, updates: Partial<Pick<TeamMember, 'nickname' | 'mbtiType' | 'role'>>) => {
    setStore(prev => ({
      ...prev,
      members: prev.members.map(m =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
  }, []);

  const incrementAnalysis = useCallback(() => {
    setStore(prev => ({ ...prev, analysisCount: prev.analysisCount + 1 }));
  }, []);

  const addAiCredits = useCallback((count: number) => {
    setStore(prev => ({ ...prev, aiCredits: prev.aiCredits + count }));
  }, []);

  const useAiCredit = useCallback(() => {
    setStore(prev => {
      if (prev.aiCredits <= 0) return prev;
      return { ...prev, aiCredits: prev.aiCredits - 1 };
    });
  }, []);

  const resetStore = useCallback(() => {
    setStore(initialStore);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    ...store,
    isLoaded,
    setMyType,
    setMyRole,
    addMember,
    removeMember,
    updateMemberNickname,
    updateMember,
    incrementAnalysis,
    addAiCredits,
    useAiCredit,
    resetStore,
  };
}
