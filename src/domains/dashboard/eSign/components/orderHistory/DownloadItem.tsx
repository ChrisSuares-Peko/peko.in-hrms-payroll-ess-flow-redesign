import { FC, useState } from 'react';

import { DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import { Flex } from 'antd';

interface DownloadItemProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const DownloadItem: FC<DownloadItemProps> = ({ label, isActive, onClick }) => {
    const [loading, setLoading] = useState(false);

    const handleClick = () => {
        if (!isActive || loading) return;
        setLoading(true);

        // Fake loader for 5 seconds
        setTimeout(() => {
            setLoading(false);
            onClick();
        }, 500);
    };

    return (
        <Flex
            align="baseline"
            gap={6}
            onClick={handleClick}
            className={
                isActive
                    ? 'text-green-600 cursor-pointer hover:!text-green-700 w-fit'
                    : 'text-gray-400 cursor-not-allowed w-fit'
            }
        >
            {loading ? <LoadingOutlined spin /> : <DownloadOutlined />}
            {label}
        </Flex>
    );
};

export default DownloadItem;
