import { useEffect } from 'react';

import { Row, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

const HotelsWeb = () => {
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

export default HotelsWeb;
