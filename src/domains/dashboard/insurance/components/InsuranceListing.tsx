import React from 'react';

import { Grid, Row } from 'antd';

import ListingDesktop from './ListingDesktop';
import ListingMobile from './ListingMobile';

interface listingProps {
    drawerFilterName: string;
    isHealthDrawer?: boolean;
}
const InsuranceListing: React.FC<listingProps> = ({ isHealthDrawer = false, drawerFilterName }) => {
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    return (
        <Row gutter={20}>
            {screens.xl ? (
                <ListingDesktop
                    drawerFilterName={drawerFilterName}
                    isHealthDrawer={isHealthDrawer}
                />
            ) : (
                <ListingMobile />
            )}
        </Row>
    );
};

export default InsuranceListing;
