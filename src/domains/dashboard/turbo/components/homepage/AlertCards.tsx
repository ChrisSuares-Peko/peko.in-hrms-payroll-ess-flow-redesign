import React from 'react';

import { Badge, Card, Button, Typography, Flex, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

type CardComponentProps = {
    title: string;
    data: any[];
    icon: string;
    type: 'expiry' | 'tasks' | 'fastag'; // Type to differentiate card styles
};
const statusStyles = {
    Expired: {
        text: '#B71215',
        background: '#FDECEC',
    },
    INVALID: {
        text: '#B78512',
        background: '#FDFDEC',
    },
};
function findColorByStatus(status: string) {
    let value = statusStyles.INVALID;
    if (status === 'Expired') {
        value = statusStyles[status];
    }
    return value;
}

const CardComponent: React.FC<CardComponentProps> = ({ title, data, type, icon }) => {
    const navigate = useNavigate();
    const handleTaskAction = (item: any) => {
        if (item.key === 'serviceDue') {
            // Single due vehicle → go straight to its details page; otherwise the fleet list.
            if (item.vehicleId) {
                navigate(
                    `${paths.dashboard.turbo}/${paths.turbo.manageFleet}/${paths.turbo.viewDetails}?id=${item.vehicleId}`
                );
            } else {
                navigate(`${paths.dashboard.turbo}/${paths.turbo.manageFleet}`);
            }
        }
    };
    return (
        <Card variant="borderless" className="rounded-2xl min-h-64 !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
        <Flex gap={10} align="center" justify="space-between">
            <Flex gap={10}>
                <ReactSVG src={icon} />
                <Typography.Title level={4} className="font-medium mt-3 ">
                    {title}
                </Typography.Title>
            </Flex>
            {type === 'fastag' && (
                <Button
                    type="link"
                    danger
                    className="px-0"
                    onClick={() =>
                        navigate(paths.dashboard.reports, {
                            state: { accessKey: accessKeys.fastag },
                        })
                    }
                >
                    View all
                </Button>
            )}
        </Flex>
        {data && data.length > 0 ? (
            <div>
                {data.map((item, index) => (
                    <Flex justify="space-between" key={index} className="mt-4">
                        {type === 'expiry' && (
                            <>
                                <Typography.Text className="text-gray-500">
                                    {item.type} Document
                                </Typography.Text>
                                <Badge
                                    color={findColorByStatus(item.status).text}
                                    text={
                                        item.status
                                            ? item.status.charAt(0) +
                                              item.status.slice(1).toLowerCase()
                                            : ''
                                    }
                                    className="px-2 rounded-2xl"
                                    style={{
                                        color: findColorByStatus(item.status).text,
                                        backgroundColor: findColorByStatus(item.status).background,
                                        padding: '1px 9px',
                                        border: '1px ',
                                        borderRadius: '15px',
                                    }}
                                />
                            </>
                        )}

                        {type === 'tasks' && (
                            <>
                                <Typography.Text className="text-gray-500">
                                    {item.count} {item.task}
                                </Typography.Text>
                                <Button
                                    type="default"
                                    danger
                                    size="middle"
                                    className="text-xs md:px-5 md:text-sm w-16 h-7 "
                                    onClick={() => handleTaskAction(item)}
                                >
                                    {item.action}
                                </Button>
                            </>
                        )}

                        {type === 'fastag' && (
                            <>
                                <Typography.Text className="text-gray-700">
                                    {item?.order?.accountNo || '-'}
                                </Typography.Text>
                                <Typography.Text className="font-semibold text-gray-900">
                                    ₹{' '}
                                    {item?.order?.amountInINR
                                        ? formatNumberWithLocalString(item.order.amountInINR)
                                        : '-'}
                                </Typography.Text>
                            </>
                        )}
                    </Flex>
                ))}
            </div>
        ) : (
            <Empty className="mt-4" />
        )}
    </Card>
    );
};

export default CardComponent;
