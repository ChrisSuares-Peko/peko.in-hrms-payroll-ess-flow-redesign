import { Button, Flex, TableProps, Typography } from 'antd';

import { paths } from '@src/routes/paths';

export const alertsColumn = (
    handleNavigate: (value: string, option?: any) => void
): TableProps<any>['columns'] => [
    {
        title: 'Alerts',
        dataIndex: 'alerts',
        key: 'alerts',
        render: (_: any, record: any) => (
            <Flex gap={10}>
                <Flex vertical justify="center">
                    <Typography.Text className="text-gray-900 text-normal ">
                        {record.title}
                    </Typography.Text>
                    <Typography.Text className="text-green-500 text-normal ">
                        {record.date}
                    </Typography.Text>
                </Flex>
            </Flex>
        ),
    },
    {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        width: '10%',
        render: (text, record) => (
            <Flex justify="center" className="px-2">
                <Button
                    type="default"
                    danger
                    className="w-full"
                    size="small"
                    onClick={() => {
                        if (record.type === 'FLEETS' || record.type === 'FLEETS_DOCS') {
                            handleNavigate(`/${paths.pekoCloud.index}/${paths.pekoCloud.fleet}`);
                        } else if (record.type === 'ASSETS' || record.type === 'ASSETS_DOCS') {
                            handleNavigate(`/${paths.pekoCloud.index}/${paths.pekoCloud.assets}`);
                        } else if (record.type === 'COMPANY_DOCS') {
                            handleNavigate(
                                `/${paths.pekoCloud.index}/${paths.pekoCloud.companyDocuments}`
                            );
                        } else if (record.type === 'FINANCIAL_DOCS') {
                            handleNavigate(
                                `/${paths.pekoCloud.index}/${paths.pekoCloud.financials}`,
                                {
                                    state: {
                                        tab: '3',
                                    },
                                }
                            );
                        } else if (record.type === 'OWNERS_DOCS') {
                            handleNavigate(
                                `/${paths.pekoCloud.index}/${paths.pekoCloud.ownershipDocuments}`
                            );
                        } else if (record.type === 'CHEQUE_LEAVES') {
                            handleNavigate(
                                `/${paths.pekoCloud.index}/${paths.pekoCloud.financials}`,
                                {
                                    state: {
                                        tab: '1',
                                    },
                                }
                            );
                        } else if (record.type === 'SUBSCRIPTIONS') {
                            handleNavigate(
                                `/${paths.pekoCloud.index}/${paths.pekoCloud.subscriptions}`
                            );
                        }
                    }}
                >
                    Update
                </Button>
            </Flex>
        ),
    },
];
