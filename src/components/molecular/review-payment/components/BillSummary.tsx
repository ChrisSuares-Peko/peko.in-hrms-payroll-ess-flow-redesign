import React, { useState } from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Col, Input, Row, Typography } from 'antd';

const { Text } = Typography;
interface BillSummaryProps {
    headName: string;
    value: string | number | undefined;
    isInput?: boolean;
}
const BillSummary = ({ headName, value, isInput }: BillSummaryProps) => {
    const [amount, setAmount] = useState<number | string | undefined>(value);
    const [isEditable, setIsEditable] = useState<boolean>(false);

    const handleEditClick = () => {
        setIsEditable(true);
    };
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isNumeric: boolean = /^[0-9]*$/.test(e.target.value);
        if (!isNumeric) return;
        setAmount(e.target.value);
    };
    return (
        <Row>
            <Col span={16}>
                <Text className="text-base font-normal">{headName}</Text>
            </Col>
            <Col span={8}>
                {isInput ? (
                    <Input
                        value={amount}
                        maxLength={8}
                        placeholder="Please Enter the amount"
                        disabled={!isEditable}
                        onChange={e => handleAmountChange(e)}
                        onBlur={() => setIsEditable(false)}
                        addonAfter={
                            <EditOutlined
                                onClick={handleEditClick}
                                className={`${isEditable ? 'text-black text-opacity-25 ' : 'text-black'}`}
                            />
                        }
                    />
                ) : (
                    <Text className="text-base font-medium">{value}</Text>
                )}
            </Col>
        </Row>
    );
};

export default BillSummary;
