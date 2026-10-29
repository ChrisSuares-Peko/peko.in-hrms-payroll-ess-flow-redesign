import { useEffect, useState } from 'react';

import { PlusCircleOutlined } from '@ant-design/icons';
import { Button, Col, ConfigProvider, Flex, Row, Tabs, TabsProps, Typography, theme } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import { paths } from '@src/routes/paths';

import PayrollAccessBanner from '../components/Dashboard/PayrollAccessBanner';
import DepartmentTab from '../components/Employees/DepartmentTab';
import DocumentRequestsTab from '../components/Employees/DocumentRequestsTab';
import EmployeesListTab from '../components/Employees/EmployeesListTab';
import NewHireTab from '../components/Employees/NewHireTab';
import ProfileUpdateRequestTab from '../components/Employees/ProfileUpdateRequestTab';
import AddEmployeeModal from '../components/modals/AddEmployeeModal';
import BulkUploadModal from '../components/modals/BulkUploadModal';
import DepartmentModal from '../components/modals/DepartmentModal';
import OffBoardEmployeeModal from '../components/modals/OffBoardEmployeeModal';
import SelectEmployeeModal from '../components/modals/SelectEmployeeModal';
import { useGetDepartmentList } from '../hooks/departmentHooks/useGetDepartmentList';
import { useValidateEmployeeSubscriptionLimit } from '../hooks/employeeHooks/useValidateEmployeeSubscriptionLimit';
import { resetEmployeeState } from '../slices/employeeSettings';

function Employees() {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    // const [departmentCount, setDepartmentCount] = useState<number>(0);
    const dispatch = useAppDispatch();
    const [page, setPage] = useState<number>(1);
    const limit = 10;
    const [searchText, setSearchText] = useState<string>('');
    const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
    const [offboardReload, setOffboardReload] = useState<boolean | number>(false);
    const debouncedSearch = useDebounce(searchText, 500);
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { validateLimit, isLoading: isValidating } = useValidateEmployeeSubscriptionLimit();
    const params = useLocation();
    const queryParams = new URLSearchParams(params.search);

    const {
        tableData,
        count,
        isLoading,
        departmentCount: dCount,
        setRefresh,
    } = useGetDepartmentList(debouncedSearch, page, limit);

    useEffect(() => {
        // setDepartmentCount(dCount);
        setLoadingInitial(false);
    }, [dCount]);

    const handleNewEmployeeClick = async () => {
        if (loadingInitial || isValidating) {
            return;
        }
        const response = await validateLimit({
            userId: id,
            userType: role,
        });

        if (!response) return;
        dispatch(resetEmployeeState());
        setOpenAddEmployeeModal(true);
    };

    const [openAddEmployeeModal, setOpenAddEmployeeModal] = useState(false);
    const [openAddDepartmentModal, setOpenAddDepartmentModal] = useState(false);
    const [openOffBoardEmployeeModal, setOpenOffBoardEmployeeModal] = useState(false);
    const [openSelectEmployeeModal, setOpenSelectEmployeeModal] = useState(false);

    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [profileUpdatePendingCount, setProfileUpdatePendingCount] = useState(0);
    const [documentRequestPendingCount, setDocumentRequestPendingCount] = useState(0);

    const currentTabKey = queryParams.get('tab') || '1';

    const tabLabel = (label: string, key: string, pendingCount = 0) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: currentTabKey === key ? colorPrimary : '#667085' }}>{label}</span>
            {pendingCount > 0 && (
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 20,
                        height: 20,
                        padding: '0 6px',
                        borderRadius: 8,
                        backgroundColor: '#FEF2F2',
                        color: colorPrimary,
                        fontSize: 12,
                        fontWeight: 600,
                    }}
                >
                    {pendingCount}
                </span>
            )}
        </span>
    );

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: tabLabel('Active Employees', '1'),
            children: (
                <EmployeesListTab
                    updateDepartmentCount={() => {}}
                    employeeStatus="active"
                    offboardReload={offboardReload as boolean}
                    setOffboardReload={setOffboardReload}
                />
            ),
        },
        {
            key: '2',
            label: tabLabel('New Hire', '2'),
            children: <NewHireTab />,
        },
        {
            key: '3',
            label: tabLabel('Departments', '3'),
            children: (
                <DepartmentTab
                    updateDepartmentCount={() => {}}
                    tableData={tableData}
                    count={count}
                    isLoading={isLoading}
                    page={page}
                    searchText={searchText}
                    setPage={setPage}
                    setRefresh={setRefresh}
                    setSearchText={setSearchText}
                />
            ),
        },
        {
            key: '4',
            label: tabLabel('Past Employees', '4'),
            children: (
                <EmployeesListTab
                    updateDepartmentCount={() => {}}
                    employeeStatus="past"
                    offboardReload={offboardReload as boolean}
                    setOffboardReload={setOffboardReload}
                />
            ),
        },
        {
            key: '5',
            label: tabLabel('Profile Update Request', '5', profileUpdatePendingCount),
            forceRender: true,
            children: (
                <ProfileUpdateRequestTab onPendingCountChange={setProfileUpdatePendingCount} />
            ),
        },
        {
            key: '6',
            label: tabLabel('Document Requests', '6', documentRequestPendingCount),
            forceRender: true,
            children: <DocumentRequestsTab onPendingCountChange={setDocumentRequestPendingCount} />,
        },
    ];

    const navigate = useNavigate();
    const handleEmployeeSelected = (employeeData: any) => {
        setSelectedEmployee(employeeData);
        setOpenSelectEmployeeModal(false);
        setOpenOffBoardEmployeeModal(true);
    };

    const [openBulkUploadModal, setOpenBulkUploadModal] = useState(false);
    const [activeTab, setActiveTab] = useState<string>(queryParams.get('tab') || '1');

    const isEmployeeTab =
        Number(activeTab) === 1 || Number(activeTab) === 2 || Number(activeTab) === 4;
    const isDepartmentTab = Number(activeTab) === 3;
    const isDocumentRequestsTab = Number(activeTab) === 6;

    let pageTitle = 'Profile Update Request';
    if (isEmployeeTab) {
        pageTitle = 'Employees';
    } else if (isDepartmentTab) {
        pageTitle = 'Departments';
    } else if (isDocumentRequestsTab) {
        pageTitle = 'Document Requests';
    }
    const pageTitleClass = isEmployeeTab
        ? 'text-neutral-700 text-xl font-medium text-center md:mt-4'
        : 'text-neutral-700 text-xl font-medium';

    let headerActions: React.ReactNode = null;
    if (isEmployeeTab) {
        headerActions = (
            <>
                <Button
                    type="primary"
                    danger
                    loading={isValidating}
                    onClick={handleNewEmployeeClick}
                    icon={<PlusCircleOutlined />}
                    className="md:w-36"
                >
                    New Employee
                </Button>
                <Button danger onClick={() => setOpenBulkUploadModal(true)}>
                    Upload Employees
                </Button>
                <Button danger onClick={() => setOpenSelectEmployeeModal(true)}>
                    Offboard Employee
                </Button>
            </>
        );
    } else if (isDepartmentTab) {
        headerActions = (
            <Button
                type="primary"
                danger
                onClick={() => setOpenAddDepartmentModal(true)}
                icon={<PlusCircleOutlined />}
            >
                Add Department
            </Button>
        );
    }

    return (
        <Content>
            <PayrollAccessBanner />
            <Row className="mt-2">
                <Col span={24}>
                    <Flex className="md:justify-between  md:flex-row xs:flex-col">
                        <Typography.Paragraph className={pageTitleClass}>
                            {pageTitle}
                        </Typography.Paragraph>

                        <Flex
                            gap={8}
                            className="md:justify-end xs:mt-1 xs:flex-col md:flex-row sm:w-32"
                        >
                            <ConfigProvider
                                theme={{
                                    token: {
                                        colorPrimary: '#FF4F4F',
                                        colorError: '#FF4F4F',
                                    },
                                }}
                            >
                                {headerActions}
                            </ConfigProvider>
                        </Flex>
                    </Flex>
                </Col>
            </Row>
            <Row>
                <Col xs={24} className="md:mt-10 mt-5">
                    <Tabs
                        defaultActiveKey="1"
                        activeKey={currentTabKey}
                        onChange={e => {
                            setActiveTab(e);
                            navigate(`/${paths.payroll.index}/${paths.payroll.employees}?tab=${e}`);
                        }}
                        items={items}
                    />
                </Col>
            </Row>
            {openAddEmployeeModal && (
                <AddEmployeeModal
                    open={openAddEmployeeModal}
                    onClose={() => setOpenAddEmployeeModal(false)}
                />
            )}
            {openAddDepartmentModal && (
                <DepartmentModal
                    setRefresh={setRefresh}
                    open={openAddDepartmentModal}
                    handleCancel={() => setOpenAddDepartmentModal(false)}
                />
            )}

            {openBulkUploadModal && (
                <BulkUploadModal
                    open={openBulkUploadModal}
                    handleCancel={() => setOpenBulkUploadModal(false)}
                />
            )}

            {openSelectEmployeeModal && (
                <SelectEmployeeModal
                    onEmployeeSelect={handleEmployeeSelected}
                    open={openSelectEmployeeModal}
                    handleCancel={() => setOpenSelectEmployeeModal(false)}
                />
            )}
            {openOffBoardEmployeeModal && (
                <OffBoardEmployeeModal
                    open={openOffBoardEmployeeModal}
                    handleCancel={() => setOpenOffBoardEmployeeModal(false)}
                    employeeData={selectedEmployee}
                    setOffboardReload={setOffboardReload}
                />
            )}
        </Content>
    );
}

export default Employees;
