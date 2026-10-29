import type { FC } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

interface ToolTipProps {
    message?: string;
}

const ToolTip: FC<ToolTipProps> = ({ message }) => (
    <Tooltip title={message}>
        <InfoCircleOutlined />
    </Tooltip>
);
export default ToolTip;
