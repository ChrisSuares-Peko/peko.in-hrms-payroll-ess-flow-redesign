import React, { useEffect } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

const Redirect = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        navigate(`${location.pathname}/eSIM`);
    }, [location.pathname, navigate]);

    return <div />;
};

export default Redirect;
