import React, { useState } from 'react';

import { FilterOutlined } from '@ant-design/icons';
import { Col, Drawer } from 'antd';

import FilterComponent from './FilterComponent';
import SearchResultCard from './SearchResultCard';
import { insuranceList } from '../utils/data';

interface ListingMobileProps {
    drawerFilterName?: string;
    isHealthDrawer?: boolean;
}

const ListingMobile = ({ drawerFilterName, isHealthDrawer }: ListingMobileProps) => {
    const [isFilterDrawerOpen, setisFilterDrawerOpen] = useState<boolean>(false);
    return (
        <>
            <Col
                span={8}
                className="border flex py-3 w-full rounded-md mb-5 justify-center"
                onClick={() => setisFilterDrawerOpen(true)}
            >
                <FilterOutlined className="mr-2" /> Filter
            </Col>
            <Drawer
                onClose={() => setisFilterDrawerOpen(false)}
                open={isFilterDrawerOpen}
                styles={{ body: { padding: 30, paddingTop: 0 } }}
            >
                <FilterComponent
                    drawerFilterName={drawerFilterName}
                    isHealthDrawer={isHealthDrawer}
                />
            </Drawer>
            <Col sm={24} xl={18} className="bg-bgGrayCard rounded-lg ">
                <SearchResultCard insuranceList={insuranceList} />
            </Col>
        </>
    );
};
export default ListingMobile;
