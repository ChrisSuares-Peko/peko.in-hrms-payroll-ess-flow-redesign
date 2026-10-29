import { Grid, Skeleton } from 'antd';
import { Content } from 'antd/es/layout/layout';

import OfficeAddressLarge from '../components/OfficeAddressLarge';
import OfficeAddressSmall from '../components/OfficeAddressSmall';

const { useBreakpoint } = Grid;
const OfficeAddress = () => {
    const screens = useBreakpoint();

    const getContent = () => {
        if (Object.keys(screens).length === 0) return <Skeleton />;
        if (screens.sm) return <OfficeAddressLarge />;
        return <OfficeAddressSmall />;
    };

    return <Content className="px-0">{getContent()}</Content>;
};

export default OfficeAddress;
