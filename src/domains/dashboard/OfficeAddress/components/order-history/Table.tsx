import React from 'react';

import { Col, Grid } from 'antd';

import MobileTable from './MobileTable';
import WebTable from './WebTable';

const Table = () => {
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const isEmpty = Object.keys(screens).length === 0;

    return !isEmpty && <Col span={24}>{screens.xs ? <MobileTable /> : <WebTable />}</Col>;
};

export default Table;
