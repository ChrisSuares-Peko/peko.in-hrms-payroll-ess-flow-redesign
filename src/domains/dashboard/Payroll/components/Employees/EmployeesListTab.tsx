import { useState } from 'react';

import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Input, Row } from 'antd';
import { saveAs } from 'file-saver';

import useScreenSize from '@src/hooks/useScreenSize';

import EmployeesTable from './EmployeesTable';
import EmployeesTableMobile from './EmployeesTableMobile';
import useDownloadEmployeeData from '../../hooks/employeeHooks/useExportEmployeeApi';

function EmployeesListTab({
    updateDepartmentCount,
    employeeStatus,
    offboardReload,
    setOffboardReload,
}: {
    updateDepartmentCount: (count: number) => void;
    employeeStatus: 'active' | 'past';
    offboardReload: boolean;
    setOffboardReload: React.Dispatch<React.SetStateAction<boolean | number>>;
}) {
    const [searchText, setSearchText] = useState('');

    const screen = useScreenSize();

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value);
    };

    const { downloadEmployeeDetails } = useDownloadEmployeeData();

    const handleExport = async () => {
        const data = await downloadEmployeeDetails(employeeStatus);
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data).buffer;
            const blob = new Blob([arrayBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, 'employees.xlsx');
        }
    };

    return (
        <Row gutter={[10, 0]}>
            <Col md={21} xs={24}>
                <Input
                    placeholder="Search Employee by name, designation or ID  "
                    suffix={<SearchOutlined />}
                    onChange={e => {
                        const value = e.target.value.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
                        handleSearch({ ...e, target: { ...e.target, value } });
                    }}
                    value={searchText} //
                    allowClear
                />
            </Col>

            <Col md={3} xs={24}>
                <Button className="md:w-36" icon={<DownloadOutlined />} onClick={handleExport}>
                    Export
                </Button>
            </Col>

            <Col span={24}>
                {screen.xs ? (
                    <EmployeesTableMobile
                        employeeStatus={employeeStatus}
                        offboardReload={offboardReload}
                        searchText={searchText}
                    />
                ) : (
                    <EmployeesTable
                        offboardReload={offboardReload}
                        setOffboardReload={setOffboardReload}
                        searchText={searchText}
                        employeeStatus={employeeStatus}
                    />
                )}
            </Col>
        </Row>
    );
}

export default EmployeesListTab;
