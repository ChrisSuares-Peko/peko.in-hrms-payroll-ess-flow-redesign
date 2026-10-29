import { Flex } from 'antd';

import { paths } from '@src/routes/paths';

import ServiceShortcutCard from './ServiceShortcutCard';
import AttendanceIcon from '../../assets/icons/attendance.svg';
import DocumentsIcon from '../../assets/icons/documents.svg';
import LeavesIcon from '../../assets/icons/leave.svg';
import MyPayIcon from '../../assets/icons/myPay.svg';
import ProfileIcon from '../../assets/icons/myProfile.svg';
import ReimbursementIcon from '../../assets/icons/reimbursement.svg';

// In-dashboard service shortcuts — no "Dashboard" card since this row lives on the dashboard itself.
const shortcuts: { title: string; icon: string; path: string }[] = [
    { title: 'Attendance', icon: AttendanceIcon, path: paths.employee.attendance },
    { title: 'My Pay', icon: MyPayIcon, path: paths.employee.payslips },
    { title: 'Leave', icon: LeavesIcon, path: paths.employee.leaves },
    { title: 'Reimbursement', icon: ReimbursementIcon, path: paths.employee.reimbursements },
    { title: 'Documents', icon: DocumentsIcon, path: paths.employee.documents },
    { title: 'My Profile', icon: ProfileIcon, path: paths.employee.profile },
];

const ServiceShortcuts = () => (
    <Flex align="flex-start" justify="space-between" gap={20} wrap="wrap" className="w-full px-2">
        {shortcuts.map(item => (
            <ServiceShortcutCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                path={item.path}
            />
        ))}
    </Flex>
);

export default ServiceShortcuts;
