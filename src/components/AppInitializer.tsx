import { useEffect } from 'react';
import { useAppDispatch } from '../store/store';
import { initializeApp } from '../store/thunks';

export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Charger les données initiales au montage du composant
    dispatch(initializeApp());
  }, [dispatch]);

  return <>{children}</>;
};

export default AppInitializer;
