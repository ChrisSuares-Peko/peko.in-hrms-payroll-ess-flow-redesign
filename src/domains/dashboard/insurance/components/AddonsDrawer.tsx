import React from 'react';

import { Button, Drawer, Flex } from 'antd';
import { Content } from 'antd/es/layout/layout';

import FilterHealthDrawerSection from './FilterHealthDrawerSection';
import FilterVehicleDrawerSection from './FilterVehicleDrawerSection';
import { addOnsDrawerData } from '../utils/data';

interface AddonsProps {
    open: boolean;
    handleClose: () => void;
    isHealthDrawer?: boolean;
}

const AddonsDrawer = ({ open, handleClose, isHealthDrawer = false }: AddonsProps) => (
    <Drawer
        open={open}
        onClose={handleClose}
        styles={{ body: { padding: 30, paddingTop: 0 } }}
        width={500}
    >
        <Content className="max-h-[37rem] overflow-x-auto">
            {isHealthDrawer ? (
                <FilterHealthDrawerSection />
            ) : (
                addOnsDrawerData.map((item, i) => (
                    <FilterVehicleDrawerSection
                        key={i}
                        sectionTitle={item.sectionTitle}
                        data={item.data}
                    />
                ))
            )}
        </Content>

        <Flex gap={30} className="mt-5">
            <Button key="clear" danger type="default" className="rounded-sm px-10 w-1/2">
                Clear
            </Button>
            <Button key="apply" danger type="primary" className=" rounded-sm px-10 w-1/2">
                Apply
            </Button>
        </Flex>
    </Drawer>
);

export default AddonsDrawer;
