import { Tag } from 'antd';

import { statusTone } from './transactionMeta';

const StatusTag = ({ status }: { status: string }) => {
    const tone = statusTone(status);
    return (
        <Tag
            className="m-0 rounded-full border-0 px-2.5 py-0.5 text-xs font-medium"
            style={{ color: tone.color, backgroundColor: tone.bg }}
        >
            {status}
        </Tag>
    );
};

export default StatusTag;
