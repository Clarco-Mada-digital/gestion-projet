import React from 'react';
import { useUser } from '../../hooks/useUser';
import { Button } from '../UI';

const Header: React.FC = () => {
  const { user, settings, updateSettings } = useUser();
  
  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    updateSettings({ theme: newTheme });
  };

  return (
    <header className={`app-header ${settings.theme}`}>
      <div className="header-content">
        <h1>Gestion de Projet</h1>
        <div className="user-actions">
          <Button onClick={toggleTheme}>
            {settings.theme === 'light' ? '🌙' : '☀️'}
          </Button>
          <div className="user-info">
            <span>{user?.name}</span>
            {user?.avatar && (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="user-avatar"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
