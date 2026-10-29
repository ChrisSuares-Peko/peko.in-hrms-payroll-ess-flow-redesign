import { CheckOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Typography, Flex, List, Divider, Tooltip } from 'antd';

export const columns = [
    {
        title: <Typography.Text className="text-lg font-medium">Services</Typography.Text>,
        dataIndex: 'services',
        key: 'services',
        render: (text: any) => text,
    },
    {
        title: <Typography.Text className="text-lg font-medium">Individual Plans</Typography.Text>,
        dataIndex: 'individualPlan',
        key: 'individualPlan',
        render: (text: any) => text,
    },
    {
        title: (
            <Flex vertical>
                <Typography.Text className="text-base font-medium">Basic</Typography.Text>
                <Typography.Text className="text-lg font-semibold">₹ 0</Typography.Text>
                <Typography.Text className="text-xs font-normal">per month</Typography.Text>
            </Flex>
        ),
        dataIndex: 'basic',
        key: 'basic',
        render: (text: any) => text, // Render React elements or components directly
    },
    {
        title: (
            <Flex vertical>
                <Typography.Text className="text-base font-medium text-lightRed">
                    Premium
                </Typography.Text>
                <Typography.Text className="text-lg font-semibold">₹ 899</Typography.Text>
                <Typography.Text className="text-xs font-normal">per month</Typography.Text>
            </Flex>
        ),
        dataIndex: 'premium',
        key: 'premium',
        render: (text: any) => text, // Render React elements or components directly
    },
    {
        title: (
            <Flex vertical>
                <Typography.Text className="text-base font-medium text-lightRed">
                    Standard
                </Typography.Text>
                <Typography.Text className="text-lg font-semibold">₹ 299</Typography.Text>
                <Typography.Text className="text-xs font-normal">per month</Typography.Text>
            </Flex>
        ),
        dataIndex: 'standard',
        key: 'standard',
        render: (text: any) => text, // Render React elements or components directly
    },
];

export const tableData = [
    {
        key: '1',
        service: '',
        services: (
            <Flex
                className="w-full h-full px-6 py-5 text-xs border border-gray-200 border-solid rounded-xl"
                justify="space-between"
                align="flex-start"
                vertical
                gap={8}
            >
                <List.Item>Utility Payments</List.Item>
                <List.Item>Office Supplies</List.Item>
                <List.Item>Corporate Travel</List.Item>
                <List.Item>Softwares</List.Item>
                <List.Item>Logistics</List.Item>
                <List.Item>Gift Cards</List.Item>
                <List.Item>Remote Hiring</List.Item>
                <List.Item>Works</List.Item>
                <List.Item>And More</List.Item>
            </Flex>
        ),
        individualPlan: (
            <Flex className="w-full h-full" vertical gap={8}>
                <Typography.Text>Free</Typography.Text>
            </Flex>
        ),
        basic: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined /> <Divider />
            </Flex>
        ),
        premium: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined /> <Divider />
            </Flex>
        ),
        standard: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined /> <Divider />
            </Flex>
        ),
    },
    // {
    //     key: '2',
    //     service: 'User Management',
    //     services: (
    //         <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
    //             <Typography.Text className="text-lg font-medium font text-lightRed">
    //                 User Management
    //             </Typography.Text>
    //             <Typography.Text> Number of Users</Typography.Text>
    //         </Flex>
    //     ),
    //     individualPlan: <Typography.Text>No Plan</Typography.Text>,
    //     basic: (
    //         <Flex vertical>
    //             <CloseOutlined /> <Divider />
    //         </Flex>
    //     ),
    //     premium: (
    //         <Flex vertical>
    //             Unlimited <Divider />
    //         </Flex>
    //     ),
    //     standard: (
    //         <Flex vertical>
    //             Unlimited <Divider />
    //         </Flex>
    //     ),
    // },
    {
        key: '3',
        service: 'eSign',
        services: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font text-lightRed">
                    eSign
                </Typography.Text>
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {' '}
                        eSign
                    </Typography.Text>
                    <Tooltip title="Digitally sign documents like offer letters, invoices, Form 16s, and more securely and conveniently online.">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
            </Flex>
        ),
        individualPlan: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font">₹ 20</Typography.Text>
                <Typography.Text> per months</Typography.Text>
            </Flex>
        ),
        basic: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CloseOutlined /> <Divider />
            </Flex>
        ),
        premium: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined /> <Divider />
            </Flex>
        ),
        standard: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined /> <Divider />
            </Flex>
        ),
    },
    {
        key: '4',
        service: 'Payroll',
        services: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font text-lightRed">
                    Payroll
                </Typography.Text>
                <Flex className="w-full" justify="space-between">
                    <Typography.Text
                        title="Upto 30 Employees"
                        className="overflow-hidden whitespace-nowrap overflow-ellipsis"
                    >
                        {' '}
                        Upto 20 Employees
                    </Typography.Text>
                    <Tooltip title="Manage payroll for up to 20 employees.">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {' '}
                        Salary Management
                    </Typography.Text>
                    <Tooltip title="Process salaries with ease. ">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {' '}
                        Leave Management
                    </Typography.Text>
                    <Tooltip title="Manage leave requests and approvals.">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden overflow-ellipsis">
                        {' '}
                        Announcements, Benefits, Reimbursements
                    </Typography.Text>
                    <Tooltip title="Manage reimbursements and benefits. Streamline communication. ">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
            </Flex>
        ),
        individualPlan: (
            <Flex className="w-full h-full" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font">₹ 150</Typography.Text>
                <Typography.Text> per months</Typography.Text>
            </Flex>
        ),
        basic: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CloseOutlined /> <Divider />
                <CloseOutlined /> <Divider />
                <CloseOutlined /> <Divider />
                <CloseOutlined /> <Divider />
            </Flex>
        ),
        premium: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined />
                <Divider /> <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider />
            </Flex>
        ),
        standard: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined /> <Divider /> <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider />
            </Flex>
        ),
    },
    {
        key: '5',
        service: 'Hub',
        services: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font text-lightRed">
                    Hub
                </Typography.Text>
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {' '}
                        Document Management
                    </Typography.Text>
                    <Tooltip title="Store documents securely. Enable easy access and real-time collaboration. ">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {' '}
                        Fleet Management
                    </Typography.Text>
                    <Tooltip title="Track usage and optimize resource allocation. ">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {' '}
                        Subscription Management
                    </Typography.Text>
                    <Tooltip title="Manage the entire subscription lifecycle efficiently.">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {' '}
                        Asset Management
                    </Typography.Text>
                    <Tooltip title="Enable seamless sharing and simplify asset management. ">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
                <Flex className="w-full" justify="space-between">
                    <Typography.Text> Reminders</Typography.Text>
                    <Tooltip title=" Set reminders for schedules, meetings, and deadlines. ">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
            </Flex>
        ),
        individualPlan: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font">₹ 150</Typography.Text>
                <Typography.Text> per months</Typography.Text>
            </Flex>
        ),
        basic: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CloseOutlined /> <Divider />
                <CloseOutlined /> <Divider />
                <CloseOutlined /> <Divider />
                <CloseOutlined /> <Divider />
                <CloseOutlined /> <Divider />
            </Flex>
        ),
        premium: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined />
                <Divider /> <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider />
                <CloseOutlined>
                    <Divider />
                </CloseOutlined>
                <Divider />
            </Flex>
        ),
        standard: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined /> <Divider /> <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider />
            </Flex>
        ),
    },
    {
        key: '6',
        service: 'Peko Club',
        services: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font text-lightRed">
                    Peko Club
                </Typography.Text>
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {' '}
                        Offers, Rewards, Tools etc
                    </Typography.Text>
                    <Tooltip title=" Connect with prominent businessmen and grow your network.">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
            </Flex>
        ),
        individualPlan: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text> No Plan</Typography.Text>
            </Flex>
        ),
        basic: (
            <Flex vertical>
                <Typography.Text>Limited Access</Typography.Text> <Divider />
            </Flex>
        ),
        premium: (
            <Flex vertical>
                <Typography.Text>Full Access</Typography.Text> <Divider />
            </Flex>
        ),
        standard: (
            <Flex vertical>
                <Typography.Text>Full Access</Typography.Text> <Divider />
            </Flex>
        ),
    },
    {
        key: '7',
        service: 'Corporate Cards',
        services: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font text-lightRed">
                    Corporate Cards
                </Typography.Text>
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {' '}
                        Expense Management
                    </Typography.Text>
                    <Tooltip title="Manage expenses and streamline reimbursements. ">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        Expense Card
                    </Typography.Text>
                    <Tooltip title="Set limits, track spending, and gain complete visibility into employee expenses. ">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
            </Flex>
        ),
        individualPlan: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font">₹ 150</Typography.Text>
                <Typography.Text> per months</Typography.Text>
            </Flex>
        ),
        basic: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CloseOutlined /> <Divider />
                <CloseOutlined /> <Divider />{' '}
            </Flex>
        ),
        premium: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined />
                <Divider />
                <CloseOutlined /> <Divider />
            </Flex>
        ),
        standard: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                {' '}
                <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider />
            </Flex>
        ),
    },
    {
        key: '8',
        service: 'Invoicing',
        services: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font text-lightRed">
                    Invoicing
                </Typography.Text>
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {' '}
                        Generate Invoice and Pay
                    </Typography.Text>
                    <Tooltip title="Generate invoices for easy payments.">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        Upload Invoice and Pay
                    </Typography.Text>
                    <Tooltip title="Simplify payments by uploading invoices.">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden overflow-ellipsis">
                        Payment Link & Payment Tracker
                    </Typography.Text>
                    <Tooltip title="Share payment links and track payment statuses.">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
            </Flex>
        ),
        individualPlan: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font">₹ 150</Typography.Text>
                <Typography.Text> per months</Typography.Text>
            </Flex>
        ),
        basic: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CloseOutlined /> <Divider />
                <CloseOutlined /> <Divider /> <CloseOutlined /> <Divider />{' '}
            </Flex>
        ),
        premium: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider /> <CloseOutlined /> <Divider />
            </Flex>
        ),
        standard: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                {' '}
                <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider />
            </Flex>
        ),
    },
    {
        key: '9',
        service: 'Corporate Travel',
        services: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font text-lightRed">
                    Corporate Travel
                </Typography.Text>
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {' '}
                        Air Ticket Booking
                    </Typography.Text>
                    <Tooltip title="Book flight tickets effortlessly.">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        Hotel Booking
                    </Typography.Text>
                    <Tooltip title="Choose from an extensive range of options. ">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        International eSim
                    </Typography.Text>
                    <Tooltip title="Stay connected as you criss-cross the globe.">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
            </Flex>
        ),
        individualPlan: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font">₹ 49</Typography.Text>
                <Typography.Text> per months</Typography.Text>
            </Flex>
        ),
        basic: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CloseOutlined /> <Divider />
                <CloseOutlined /> <Divider /> <CloseOutlined /> <Divider />{' '}
            </Flex>
        ),
        premium: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider /> <CloseOutlined /> <Divider />
            </Flex>
        ),
        standard: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                {' '}
                <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider />
            </Flex>
        ),
    },
    {
        key: '10',
        service: 'Accounting & Tax',
        services: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font text-lightRed">
                    Accounting & Tax
                </Typography.Text>
                <Flex className="w-full" justify="space-between">
                    <Typography.Text>Corporate Tax Registration</Typography.Text>
                    <Tooltip title="Ensure 100% compliance. ">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
                <Flex className="w-full" justify="space-between">
                    <Typography.Text>VAT Registration and Filing</Typography.Text>
                    <Tooltip title="Professional services. ">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
                <Flex className="w-full" justify="space-between">
                    <Typography.Text>Bookkeeping</Typography.Text>
                    <Tooltip title=" A dedicated team of specialists. ">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
            </Flex>
        ),
        individualPlan: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font">₹ 599</Typography.Text>
                <Typography.Text> per months</Typography.Text>
            </Flex>
        ),
        basic: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <Typography.Text className="overflow-hidden whitespace-pre-wrap overflow-ellipsis">
                    Registration for ₹ 499
                </Typography.Text>{' '}
                <Divider />
                <Typography.Text className="overflow-hidden whitespace-pre-wrap overflow-ellipsis">
                    Registration for ₹ 499
                </Typography.Text>{' '}
                <Divider /> <CloseOutlined /> <Divider />{' '}
            </Flex>
        ),
        premium: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <Typography.Text className="overflow-hidden whitespace-pre-wrap overflow-ellipsis">
                    Registration for ₹ 499
                </Typography.Text>{' '}
                <Divider />
                <Typography.Text className="overflow-hidden whitespace-pre-wrap overflow-ellipsis">
                    Registration for ₹ 499
                </Typography.Text>{' '}
                <Divider /> <CloseOutlined /> <Divider />{' '}
            </Flex>
        ),
        standard: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider />
                <CheckOutlined />
                <Divider />
            </Flex>
        ),
    },
    {
        key: '11',
        service: 'Vendor Payouts',
        services: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font text-lightRed">
                    Vendor Payouts
                </Typography.Text>
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {' '}
                        Vendor Payments
                    </Typography.Text>
                    <Tooltip title="Streamline vendor payments.">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
            </Flex>
        ),
        individualPlan: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font">₹ 49</Typography.Text>
                <Typography.Text> per months</Typography.Text>
            </Flex>
        ),
        basic: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CloseOutlined /> <Divider />{' '}
            </Flex>
        ),
        premium: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined /> <Divider />
            </Flex>
        ),
        standard: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined /> <Divider />
            </Flex>
        ),
    },
    {
        key: '12',
        service: 'Phantom (Peko AI)',
        services: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font text-lightRed">
                    Phantom (Peko AI)
                </Typography.Text>
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {' '}
                        Business Chatbox
                    </Typography.Text>
                    <Tooltip title="Chatbox">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
            </Flex>
        ),
        individualPlan: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font">₹ 49</Typography.Text>
                <Typography.Text> per months</Typography.Text>
            </Flex>
        ),
        basic: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CloseOutlined /> <Divider />{' '}
            </Flex>
        ),
        premium: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined /> <Divider />
            </Flex>
        ),
        standard: (
            <Flex vertical className="w-full h-full" align="flex-start" gap={10}>
                <CheckOutlined /> <Divider />
            </Flex>
        ),
    },
    {
        key: '13',
        service: 'WhatsApp Basic',
        services: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font text-lightRed">
                    Whatsapp Basic
                </Typography.Text>
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {' '}
                        Business Whatsapp services
                    </Typography.Text>
                    <Tooltip title="Enhance client relations using messaging and automation for effective engagement.">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
            </Flex>
        ),
        individualPlan: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font">₹ 49</Typography.Text>
                <Typography.Text> per months</Typography.Text>
            </Flex>
        ),
        basic: (
            <Flex vertical>
                <CloseOutlined /> <Divider />{' '}
            </Flex>
        ),
        premium: (
            <Flex vertical>
                <CheckOutlined /> <Divider />{' '}
            </Flex>
        ),
        standard: (
            <Flex vertical>
                {' '}
                <CheckOutlined />
                <Divider />
            </Flex>
        ),
    },
    {
        key: '13',
        service: 'WhatsApp Basic',
        services: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font text-lightRed">
                    Whatsapp Basic
                </Typography.Text>
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {' '}
                        Business Whatsapp services
                    </Typography.Text>
                    <Tooltip title="Enhance client relations using messaging and automation for effective engagement.">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
            </Flex>
        ),
        individualPlan: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font">₹ 49</Typography.Text>
                <Typography.Text> per months</Typography.Text>
            </Flex>
        ),
        basic: (
            <Flex vertical>
                <CloseOutlined /> <Divider />{' '}
            </Flex>
        ),
        premium: (
            <Flex vertical>
                <CheckOutlined /> <Divider />{' '}
            </Flex>
        ),
        standard: (
            <Flex vertical>
                {' '}
                <CloseOutlined />
                <Divider />
            </Flex>
        ),
    },
    {
        key: '13',
        service: 'Whatsapp Pro',
        services: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font text-lightRed">
                    Whatsapp Pro
                </Typography.Text>
                <Flex className="w-full" justify="space-between">
                    <Typography.Text className="overflow-hidden whitespace-nowrap overflow-ellipsis">
                        {' '}
                        Business Whatsapp services
                    </Typography.Text>
                    <Tooltip title="Enhance client relations using messaging and automation for effective engagement.">
                        <InfoCircleOutlined />
                    </Tooltip>
                </Flex>
                <Divider />
            </Flex>
        ),
        individualPlan: (
            <Flex className="w-full h-full" align="flex-start" vertical gap={8}>
                <Typography.Text className="text-lg font-medium font">₹ 49</Typography.Text>
                <Typography.Text> per months</Typography.Text>
            </Flex>
        ),
        basic: (
            <Flex vertical>
                <CloseOutlined /> <Divider />{' '}
            </Flex>
        ),
        premium: (
            <Flex vertical>
                <CloseOutlined /> <Divider />{' '}
            </Flex>
        ),
        standard: (
            <Flex vertical>
                {' '}
                <CheckOutlined />
                <Divider />
            </Flex>
        ),
    },
];
