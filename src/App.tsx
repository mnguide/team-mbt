import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import MyCard from './pages/MyCard';
import Chemistry from './pages/Chemistry';
import ChemistryResult from './pages/ChemistryResult';
import AiAnalysis from './pages/AiAnalysis';
import TeamReport from './pages/TeamReport';
import ObservationQuiz from './pages/ObservationQuiz';
import Collection from './pages/Collection';
import MemberDetail from './pages/MemberDetail';
import RelationshipMap from './pages/RelationshipMap';
import TeamInsights from './pages/TeamInsights';
import { useTeamStore } from './hooks/useTeamStore';
import { usePurchase } from './hooks/usePurchase';

export default function App() {
  const store = useTeamStore();
  const { checkPendingOrders } = usePurchase();

  // Recover pending IAP orders on startup
  useEffect(() => {
    checkPendingOrders((count) => {
      store.addAiCredits(count);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!store.isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home />} />
      <Route
        path="/my-card"
        element={<MyCard myType={store.myType} onSetMyType={store.setMyType} />}
      />
      <Route
        path="/chemistry"
        element={<Chemistry myType={store.myType} />}
      />
      <Route
        path="/chemistry-result"
        element={
          <ChemistryResult
            analysisCount={store.analysisCount}
            onIncrementAnalysis={store.incrementAnalysis}
            onAddMember={store.addMember}
          />
        }
      />
      <Route
        path="/ai-analysis"
        element={
          <AiAnalysis
            aiCredits={store.aiCredits}
            onUseCredit={store.useAiCredit}
            onAddCredits={store.addAiCredits}
          />
        }
      />
      <Route
        path="/team-report"
        element={
          <TeamReport
            myType={store.myType}
            members={store.members}
            onRemoveMember={store.removeMember}
          />
        }
      />
      <Route
        path="/quiz"
        element={<ObservationQuiz myType={store.myType} />}
      />
      <Route
        path="/collection"
        element={
          <Collection
            members={store.members}
            onAddMember={store.addMember}
            onRemoveMember={store.removeMember}
          />
        }
      />
      <Route
        path="/member/:id"
        element={
          <MemberDetail
            members={store.members}
            onUpdateMember={store.updateMember}
            onRemoveMember={store.removeMember}
          />
        }
      />
      <Route
        path="/relationship-map"
        element={<RelationshipMap members={store.members} />}
      />
      <Route
        path="/team-insights"
        element={<TeamInsights members={store.members} />}
      />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
