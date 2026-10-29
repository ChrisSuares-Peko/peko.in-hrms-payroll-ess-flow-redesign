import React from 'react';

import { Alert, Flex, Typography } from 'antd';

import { type CustomerDetails } from '../../types/index';

const { Text } = Typography;

interface Props {
    customerFromCart: CustomerDetails;
    onRegisterNew: () => void;
    onLoginDifferent: () => void;
}

const CustomerInfoCard: React.FC<Props> = ({ customerFromCart, onRegisterNew, onLoginDifferent }) => {
    const fields = [
        { label: 'Name', value: customerFromCart.name },
        { label: 'Email', value: customerFromCart.useremail },
        { label: 'Company', value: customerFromCart.company },
        {
            label: 'Phone',
            value: `+${customerFromCart.mobilenocc || customerFromCart.telnocc || ''} ${customerFromCart.mobileno || customerFromCart.telno || ''}`.trim(),
        },
        {
            label: 'Address',
            value: [
                customerFromCart.address1,
                customerFromCart.city,
                customerFromCart.state,
                customerFromCart.country,
                customerFromCart.zip,
            ]
                .filter(Boolean)
                .join(', '),
        },
    ];

    return (
        <>
            <Alert type="success" message="Customer already registered" showIcon className="mb-3" />
            <div
                className="bg-gray-50"
                style={{
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginBottom: 12,
                }}
            >
                <Flex vertical gap={6}>
                    {fields.map(({ label, value }) => (
                        <Flex key={label} gap={8}>
                            <Text type="secondary" style={{ minWidth: 60, fontSize: 13 }}>
                                {label}:
                            </Text>
                            <Text style={{ fontSize: 13 }}>{value}</Text>
                        </Flex>
                    ))}
                </Flex>
            </div>
            {/* <Flex gap={8}>
                <Button size="small" onClick={onRegisterNew}>
                    Register New
                </Button>
                <Button size="small" onClick={onLoginDifferent}>
                    Login Different
                </Button>
            </Flex> */}
        </>
    );
};

export default CustomerInfoCard;
