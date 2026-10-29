import { useEffect } from 'react';

import { Row } from 'antd';
import Skeleton from 'react-loading-skeleton';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

const Home = () => {
    const navigate = useNavigate();
    useEffect(() => {
        navigate(`${paths.dashboard.corporateTravel}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <Row>
            <Skeleton />
        </Row>
    );
};

export default Home;
