import React from 'react';

import { Flex, Typography } from 'antd';
import { Link } from 'react-router-dom';

import KeyValueDisplay from './KeyValueDisplay';

interface ShareholderInfoProps {
    shareholder: any;
}

const ShareholderInfo: React.FC<ShareholderInfoProps> = ({ shareholder }) => {
    const { ownerName, document, designation, nationality, percentageShares, ownerNumber } =
        shareholder;

    return (
        <Flex vertical className="mt-3">
            <Typography.Text className="text-base font-bold">
                Shareholder {ownerNumber}:
            </Typography.Text>
            <KeyValueDisplay label="Shareholder Name" value={ownerName} />
            <KeyValueDisplay label="Designation" value={designation} />
            <KeyValueDisplay label="Nationality" value={nationality} />
            <KeyValueDisplay label="Percentage of Shares" value={`${percentageShares}%`} />
            <Flex justify="space-between" className="mt-3">
                <Typography.Text className="text-base">Document</Typography.Text>
                <Link
                    to={document}
                    style={{ color: '#FF3A3A' }}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    View
                </Link>
            </Flex>
        </Flex>
    );
};

export default ShareholderInfo;
