import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import useFromWhere from '../general/useFromWhere';

const useNavigateFromProductPage = () => {
    const navigate = useNavigate();
    const fromWhere = useFromWhere(1);

    const navigateFromProductPage = () => {
        let navigatePath = '';
        switch (fromWhere) {
            case paths.softwares.index:
                navigatePath = `/${paths.softwares.index}`;
                break;
            case paths.softwares.category:
                navigatePath = `/${paths.softwares.index}/${paths.softwares.category}`;
                break;
            case paths.softwares.searchResults:
                navigatePath = `/${paths.softwares.index}/${paths.softwares.searchResults}`;
                break;
            default:
                navigatePath = `/${paths.softwares.index}`;
        }
        navigate(navigatePath, { replace: true });
    };
    return { navigateFromProductPage };
};

export default useNavigateFromProductPage;
