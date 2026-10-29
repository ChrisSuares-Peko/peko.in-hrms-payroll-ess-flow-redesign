import { useLocation } from 'react-router-dom';

const useFromWhere = (position: number) => {
    const location = useLocation();
    const routes = location.pathname.split('/');
    const fromWhere = routes[routes.length - position];
    return fromWhere;
};

export default useFromWhere;
