import { useEffect } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Col, Input, Row } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import DepartmentTable from './DepartmentTable';
import DepartmentTableMobile from './DepartmentTableMobile';
import { departmentTableData } from '../../types/departmentTypes/departmentTypes';

interface departmentProps {
    updateDepartmentCount: (count: number) => void;
    tableData: departmentTableData[];
    count: number;
    setRefresh: (value: any) => void;
    page: number;
    searchText: string;
    setSearchText: (value: any) => void;
    setPage: (value: any) => void;
    isLoading: boolean;
}
function DepartmentTab({
    updateDepartmentCount,
    tableData,
    count,
    setRefresh,
    page,
    searchText,
    setSearchText,
    setPage,
    isLoading,
}: departmentProps) {
    const screen = useScreenSize();

    useEffect(() => {
        updateDepartmentCount(tableData.length);
    }, [tableData, updateDepartmentCount]);

    return (
        <Row>
            <Col span={24}>
                <Input
                    placeholder="Search Department by name"
                    suffix={<SearchOutlined />}
                    // onChange={e => setSearchText(e.target.value)}
                    onChange={e => {
                        const value = e.target.value.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
                        setSearchText(value)
                    }}
                    value={searchText}
                    allowClear
                />
            </Col>
            <Col span={24}>
                {screen.xs ? (
                    <DepartmentTableMobile
                        count={count}
                        page={page}
                        setPage={setPage}
                        tableData={tableData}
                        isLoading={isLoading}
                        setRefresh={setRefresh}
                    />
                ) : (
                    <DepartmentTable
                        count={count}
                        page={page}
                        setPage={setPage}
                        tableData={tableData}
                        isLoading={isLoading}
                        setRefresh={setRefresh}
                    />
                )}
            </Col>
        </Row>
    );
}

export default DepartmentTab;
