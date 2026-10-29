import React from 'react';

import { Col } from 'antd';

import FilterComponent from './FilterComponent';
import SearchResultCard from './SearchResultCard';
import { insuranceList } from '../utils/data';

interface ListingDesktopProps {
    drawerFilterName?: string;
    isHealthDrawer?: boolean;
}
const ListingDesktop = ({ drawerFilterName, isHealthDrawer }: ListingDesktopProps) => (
    <>
        <Col sm={24} xl={6}>
            <FilterComponent drawerFilterName={drawerFilterName} isHealthDrawer={isHealthDrawer} />
        </Col>
        <Col sm={24} xl={18} className="bg-gray-100 rounded-lg ">
            <SearchResultCard insuranceList={insuranceList} />
        </Col>
    </>
);

export default ListingDesktop;
