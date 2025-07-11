import { useAppSelector, useAppDispatch } from '../store/store';
import { updateUserSettings, updateAppSettings } from '../store/slices/userSlice';

export const useUser = () => {
  const { currentUser, appSettings } = useAppSelector((state) => ({
    currentUser: state.user.currentUser,
    appSettings: state.user.appSettings,
  }));

  const dispatch = useAppDispatch();

  const updateSettings = (settings: Partial<typeof currentUser.settings>) => {
    dispatch(updateUserSettings(settings));
  };

  const updateSettingsApp = (settings: Partial<typeof appSettings>) => {
    dispatch(updateAppSettings(settings));
  };

  return {
    user: currentUser,
    settings: currentUser?.settings || {},
    appSettings,
    updateSettings,
    updateAppSettings: updateSettingsApp,
    isAdmin: currentUser?.role === 'admin',
  };
};

export default useUser;
