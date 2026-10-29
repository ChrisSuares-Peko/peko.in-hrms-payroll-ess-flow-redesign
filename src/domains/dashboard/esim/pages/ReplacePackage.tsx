import React, { useEffect } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

type Props = {};

const ReplacePackage = (props: Props) => {
    const { state } = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        navigate(
            `${paths.dashboard.corporateTravel}/${paths.esim.index}/${paths.esim.packages}/${paths.esim.details}`,
            {
                state: {
                    ...state,
                },
            }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div>ReplacePackage</div>;
};

export default ReplacePackage;
