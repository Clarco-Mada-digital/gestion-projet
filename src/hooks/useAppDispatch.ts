import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store/store';

// Utilisez useAppDispatch au lieu de useDispatch standard pour avoir un typage correct
export const useAppDispatch = () => useDispatch<AppDispatch>();
