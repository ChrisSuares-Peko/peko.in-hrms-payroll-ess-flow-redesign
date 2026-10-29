import React from 'react';

import { Card, Flex, Image, Typography } from 'antd';

import TextAreaInput from '@components/atomic/inputs/TextAreaInput';

import newRFQsIcon from '../../../assets/icons/newRFQsIcon.svg';

const { Text } = Typography;

const TermsAndNotes: React.FC = () => (
    <Card bordered={false} className="rounded-2xl mb-4" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: 24 } }}>
        <Flex gap={10} align="center" className="mb-4">
            <Flex
                align="center"
                justify="center"
                className="w-7 h-7 rounded-lg shrink-0 bg-red-50"
            >
                <Image src={newRFQsIcon} alt="New RFQ" width={16} height={16} preview={false} />
            </Flex>
            <Flex vertical>
                <Text strong className="text-sm">Terms &amp; Notes</Text>
                <Text className="text-xs text-[rgba(0,0,0,0.45)]">Any conditions vendors should be aware of</Text>
            </Flex>
        </Flex>

        <TextAreaInput
            name="terms"
            label="Terms &amp; Conditions"
            placeholder=""
            minRows={3}
            showCount
            maxLength={5000}
        />

        <Flex vertical style={{ marginBottom: -14 }}>
            <TextAreaInput
                name="notes"
                label="Notes"
                placeholder=""
                minRows={3}
                showCount
                maxLength={2000}
            />
        </Flex>
    </Card>
);

export default TermsAndNotes;
