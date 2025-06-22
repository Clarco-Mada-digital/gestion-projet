import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sidebar } from './Sidebar';
import { TodayView } from '../Views/TodayView';
import { ProjectsView } from '../Views/ProjectsView';
import { KanbanView } from '../Views/KanbanView';
import { CalendarView } from '../Views/CalendarView';
import { SettingsView } from '../Views/SettingsView';
import { Team } from '../../types';
import { TeamModal } from '../Modals/TeamModal';

export function MainLayout() {
  const { state, dispatch } = useApp();
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);

  const handleOpenTeamModal = (team?: Team) => {
    setCurrentTeam(team || null);
    setIsTeamModalOpen(true);
  };

  const handleCloseTeamModal = () => {
    setIsTeamModalOpen(false);
    setCurrentTeam(null);
  };

  const handleTeamSubmit = (teamData: { name: string; email: string; description: string }) => {
    const team: Team = {
      id: currentTeam?.id || `team-${Date.now()}`,
      name: teamData.name,
      email: teamData.email,
      description: teamData.description,
      members: currentTeam?.members || [],
      projects: currentTeam?.projects || [],
      createdAt: currentTeam?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (currentTeam?.id) {
      dispatch({ type: 'UPDATE_TEAM', payload: team });
    } else {
      dispatch({ type: 'ADD_TEAM', payload: team });
    }

    handleCloseTeamModal();
  };

  const renderCurrentView = () => {
    switch (state.currentView) {
      case 'today':
        return <TodayView />;
      case 'projects':
        return <ProjectsView />;
      case 'kanban':
        return <KanbanView />;
      case 'calendar':
        return <CalendarView />;
      case 'settings':
        return (
          <SettingsView 
            onOpenTeamModal={handleOpenTeamModal}
            onCloseTeamModal={handleCloseTeamModal}
            isTeamModalOpen={isTeamModalOpen}
            currentTeam={currentTeam}
          />
        );
      default:
        return <TodayView />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-10xl mx-auto p-6">
          {renderCurrentView()}
        </div>
      </main>

      {/* Modal d'équipe */}
      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={handleCloseTeamModal}
        team={currentTeam}
        onSubmit={handleTeamSubmit}
      />
    </div>
  );
}
