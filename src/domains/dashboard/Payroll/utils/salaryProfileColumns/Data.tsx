import { DownloadOutlined, MailOutlined } from '@ant-design/icons';
import { Badge, Button, Space, TableProps, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { CalenderIcon, medicalIcon } from '../../assets/icons/leaveSummary';
import image from '../../assets/icons/leaveSummary/calendar-check.svg';
import {
    ClipboardIcon,
    WalletIcon,
    HomeIcon,
    CarIcon,
    TimeClockIcon,
} from '../../assets/icons/salaryProfile';
import {
    payrollTableType,
    salaryTableData,
    salaryTableRow,
} from '../../types/salaryProfileTypes/ProfileTypes';
import { formatDate } from '../general/formatter';

export const generateSalaryProfileData = (profileData: salaryTableData | undefined) => {
    const dateOfJoin = profileData ? formatDate(profileData.dateOfJoin) : '';
    return profileData
        ? [
              {
                  title: profileData.department,
                  subtitle: 'Department',
                  icon: ClipboardIcon,
              },
              {
                  title: `AED ${formatNumberWithLocalString(profileData?.basicSalary)}`,
                  subtitle: 'Basic Salary',
                  icon: WalletIcon,
              },
              {
                  title: `AED ${formatNumberWithLocalString(profileData?.homeAllowance)}`,
                  subtitle: 'Home Allowances ',
                  icon: HomeIcon,
              },
              {
                  title: `AED ${formatNumberWithLocalString(profileData?.travelAllowance)}`,
                  subtitle: 'Travel Allowances',
                  icon: CarIcon,
              },
              {
                  title: `AED ${formatNumberWithLocalString(profileData?.medicalAllowance)}`,
                  subtitle: 'Medical Allowances',
                  icon: medicalIcon,
              },
              {
                  title: `AED ${formatNumberWithLocalString(profileData?.otherAllowance)}`,
                  subtitle: 'Other Allowances',
                  icon: WalletIcon,
              },
              //     {
              //       title: `AED ${formatNumberWithLocalString(profileData.other)}`,
              //       subtitle: 'Other',
              //       icon: SuitCaseIcon,
              //   },

              {
                  title: `${profileData.schedule}`,
                  subtitle: 'Work Shift',
                  icon: TimeClockIcon,
              },
              {
                  title: dateOfJoin,
                  subtitle: 'Joining Date',
                  icon: image,
              },
          ]
        : [
              {
                  title: '',
                  subtitle: 'Department',
                  icon: ClipboardIcon,
              },
              {
                  title: '',
                  subtitle: 'Basic Salary',
                  icon: WalletIcon,
              },
              {
                  title: '',
                  subtitle: 'Home Allowance Salary',
                  icon: HomeIcon,
              },
              {
                  title: '',
                  subtitle: 'Travel Allowance',
                  icon: CarIcon,
              },
              {
                  title: '',
                  subtitle: 'Medical Allowance',
                  icon: medicalIcon,
              },
              {
                  title: '',
                  subtitle: 'Other Allowance',
                  icon: WalletIcon,
              },

              {
                  title: '',
                  subtitle: 'Work Shift',
                  icon: TimeClockIcon,
              },
              {
                  title: dateOfJoin,
                  subtitle: 'Joining Date',
                  icon: CalenderIcon,
              },
          ];
};
export const SalarySectionColumns = (): TableProps<salaryTableRow>['columns'] => [
    {
        title: <Typography.Text>Basic Salary</Typography.Text>,
        dataIndex: 'basicSalary',
        key: 'basicSalary',
        render: text => (
            <Typography.Text className="font-normal text-salaryTableSubText">
                AED{' '}
                {parseFloat(text)
                    .toFixed(2)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </Typography.Text>
        ),
    },
    {
        title: <Typography.Text>Total Allowance</Typography.Text>,
        dataIndex: 'totalAllowance',
        key: 'totalAllowance',
        render: text => (
            <Typography.Text className="font-normal text-salaryTableSubText">
                AED{' '}
                {parseFloat(text)
                    .toFixed(2)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </Typography.Text>
        ),
    },
    {
        title: <Typography.Text>Overtime</Typography.Text>,
        dataIndex: 'totalOvertime',
        key: 'overtime',
        render: text => (
            <Typography.Text className="font-normal text-salaryTableSubText">
                AED{' '}
                {parseFloat(text)
                    .toFixed(2)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </Typography.Text>
        ),
    },
    {
        title: <Typography.Text>Incentives</Typography.Text>,
        dataIndex: 'totalIncentive',
        key: 'incentives',
        render: text => (
            <Typography.Text className="font-normal text-salaryTableSubText">
                AED{' '}
                {parseFloat(text)
                    .toFixed(2)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </Typography.Text>
        ),
    },

    {
        title: <Typography.Text>Bonus</Typography.Text>,
        dataIndex: 'totalBonus',
        key: 'bonus',
        render: text => (
            <Typography.Text className="font-normal text-salaryTableSubText">
                AED{' '}
                {parseFloat(text)
                    .toFixed(2)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </Typography.Text>
        ),
    },
    {
        title: <Typography.Text>Deductions</Typography.Text>,
        dataIndex: 'totalOtherDeduction',
        key: 'deductions',
        render: text => (
            <Typography.Text className="font-normal text-salaryTableSubText">
                AED{' '}
                {parseFloat(text)
                    .toFixed(2)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </Typography.Text>
        ),
    },
    {
        title: <Typography.Text>Total Pay</Typography.Text>,
        dataIndex: 'totalPayable',
        key: 'totalPay',
        render: text => (
            <Typography.Text className="font-semibold text-textLime">
                AED{' '}
                {parseFloat(text)
                    .toFixed(2)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </Typography.Text>
        ),
    },
];
export const generateSalaryTableData = (profileData?: salaryTableData): Array<salaryTableRow> => [
    {
        basicSalary: profileData?.basicSalary,
        totalAllowance: profileData?.totalAllowance,
        totalOvertime: profileData?.totalOvertime,
        totalIncentive: profileData?.totalIncentive,
        totalBonus: profileData?.totalBonus,
        totalOtherDeduction: profileData?.totalOtherDeduction,
        totalPayable: profileData?.totalPayable,
    },
];
export const payrollColumn = (
    handleDownload: (id: string) => void,
    handleEmail: (id: string) => void
): TableProps<payrollTableType>['columns'] => [
    {
        title: <Typography.Text>Payrun</Typography.Text>,
        dataIndex: 'payrun',
        key: 'payrun',
        width: '10%',
        render: text => <Typography.Text>{text}</Typography.Text>,
    },
    {
        title: <Typography.Text>Payrun Mode</Typography.Text>,
        dataIndex: 'payrunMode',
        key: 'payrunMode',
        width: '10%',
        render: text => <Typography.Text>{text}</Typography.Text>,
    },
    {
        title: <Typography.Text>Status</Typography.Text>,
        dataIndex: 'status',
        key: 'status',
        width: '10%',
        render: text => {
            if (text === 'PAID') {
                return (
                    <Badge
                        status="success"
                        text="Paid"
                        className="px-2 rounded-2xl"
                        style={{ color: '#027A48', fontSize: '0.838rem' }}
                    />
                );
            }
            if (text === 'APPROVED') {
                return (
                    <Badge
                        status="success"
                        text="Approved"
                        className="px-2 rounded-2xl"
                        style={{ color: '#027A48', fontSize: '0.838rem' }}
                    />
                );
            }
            // if (text === 'PENDING') {
            //     return (
            //         <Badge
            //             status="error"
            //             text="Pending"
            //             className="px-2 rounded-2xl"
            //             style={{ color: '#F15046', fontSize: '0.838rem' }}
            //         />
            //     );
            // }
            // if (text === 'FAILD') {
            //     // Assuming this should also say "Failed" rather than "Pending"
            //     return (
            //         <Badge
            //             status="error"
            //             text="Failed" // Correcting the typo here
            //             className="px-2 rounded-2xl"
            //             style={{ color: '#F15046', fontSize: '0.838rem' }}
            //         />
            //     );
            // }
            if (text === 'UPCOMING') {
                return (
                    <Badge
                        status="warning"
                        text="Upcoming"
                        className="px-2 rounded-2xl"
                        style={{ color: '#FAAD14', fontSize: '0.838rem' }}
                    />
                );
            }
            // Default case for any other status
            return <Badge status="default" text={text} className="px-2 rounded-2xl" />;
        },
    },

    {
        title: <Typography.Text>Total Paid</Typography.Text>,
        dataIndex: 'totalPaid',
        key: 'totalPaid',
        width: '10%',

        render: (text, record) =>
            record.status === 'paid' ? (
                <Typography.Text>{`AED ${formatNumberWithLocalString(text)}`}</Typography.Text>
            ) : (
                <Typography.Text>AED 0.00</Typography.Text>
            ),
    },
    {
        title: <Typography.Text>Action</Typography.Text>,
        dataIndex: 'action',
        key: 'action',
        render: (text, record) => (
            <Space size="middle">
                {(record.status === 'APPROVED' || record.status === 'PAID') && (
                    <>
                        <Button
                            className="border-0"
                            onClick={() => handleDownload(record.slipId)} // Attach onClick event to the button
                        >
                            <DownloadOutlined className="text-black-400" />
                        </Button>
                        <Button
                            className="border-0"
                            onClick={() => handleEmail(record.slipId)} // Attach onClick event to the button
                        >
                            <MailOutlined className="text-green-400" />
                        </Button>
                    </>
                )}
            </Space>
        ),

        width: '5%',
    },
];
