import { useAppSelector } from './store';

export default function useIsSystemAdmin() {
    return useAppSelector(state => Boolean(state.reducer.services.isAdmin));
}
