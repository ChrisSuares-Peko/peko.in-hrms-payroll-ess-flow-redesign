import React from 'react';

import { Divider, Flex, Modal, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import FairRuleCollapse from './FairRuleCollapse';
import FareBaggageInfo from './FareBaggageInfo';
import { AllFareQuote, FareRules } from '../types/fareRules';

interface modalProps {
    handleCancel: () => void;
    open: boolean;
    fareRulesData: FareRules[];
    fareQuotes?: AllFareQuote;
}
const FairRulesModal = ({ handleCancel, open, fareRulesData, fareQuotes }: modalProps) => (
    <Modal
        title="Fare Rules and Baggage"
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={990}
        centered
    >
        <Divider />
        <Content className="sm:px-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Flex vertical gap={24} className="sm:mt-4">
                {fareQuotes && <FareBaggageInfo fareQuotes={fareQuotes} />}
                <Flex vertical gap={12}>
                    {fareQuotes && (
                        <Typography.Text className="text-base font-semibold text-slate-900">
                            Fare rules
                        </Typography.Text>
                    )}
                    <FairRuleCollapse
                        fareRulesData={fareRulesData}
                        isRefundable={fareQuotes?.combined?.IsRefundable}
                    />
                </Flex>
            </Flex>
        </Content>
    </Modal>
);

export default FairRulesModal;
