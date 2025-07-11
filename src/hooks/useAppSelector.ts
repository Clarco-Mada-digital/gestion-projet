import { TypedUseSelectorHook, useSelector } from 'react-redux';
import type { RootState } from '../store/store';

// Utilisez useAppSelector au lieu de useSelector standard pour avoir un typage correct
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
