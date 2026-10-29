// PROTOTYPE-SETUP: in-page navigation for the ESS pages mounted at /ess/* inside the corporate dashboard
// layout (EmployeePortalLayout is not used here, so the main sidebar stays visible).
import { Suspense } from 'react';

import { Flex, Segmented, Skeleton, Tag, Typography } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { DEMO_EMPLOYEE } from '../demoEmployee';
import { ESS_ROOT } from '../essSession';

export const ESS_NAV_ITEMS = [
    { label: 'Home', value: ESS_ROOT },
    { label: 'Profile', value: `${ESS_ROOT}/profile` },
    { label: 'Attendance', value: `${ESS_ROOT}/attendance` },
    { label: 'My Pay', value: `${ESS_ROOT}/payslips` },
    { label: 'Leaves', value: `${ESS_ROOT}/leaves` },
    { label: 'Reimbursements', value: `${ESS_ROOT}/reimbursements` },
    { label: 'Documents', value: `${ESS_ROOT}/documents` },
];

const activeItem = (pathname: string) => {
    const lower = pathname.toLowerCase().replace(/\/+$/, '');
    return (
        [...ESS_NAV_ITEMS]
            .sort((a, b) => b.value.length - a.value.length)
            .find(item => lower === item.value || lower.startsWith(`${item.value}/`))?.value ??
        ESS_ROOT
    );
};

const EssPrototypeLayout = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    return (
        <Flex vertical gap={16} className="w-full min-w-0">
            <Flex vertical gap={8} className="w-full min-w-0">
                <Flex align="center" gap={8} wrap="wrap">
                    <Typography.Text type="secondary" className="text-xs">
                        Employee Self-Service · viewing as
                    </Typography.Text>
                    <Tag color="blue" className="m-0">
                        {DEMO_EMPLOYEE.name} · {DEMO_EMPLOYEE.designation}
                    </Tag>
                </Flex>
                <div className="w-full min-w-0 overflow-x-auto">
                    <Segmented
                        options={ESS_NAV_ITEMS}
                        value={activeItem(pathname)}
                        onChange={value => navigate(String(value))}
                    />
                </div>
            </Flex>
            <Suspense fallback={<Skeleton active />}>
                <Outlet />
            </Suspense>
        </Flex>
    );
};

export default EssPrototypeLayout;
