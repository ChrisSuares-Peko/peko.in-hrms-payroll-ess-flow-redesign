import { Tag } from 'antd';

interface NonLccTagProps {
    lcc?: boolean;
    className?: string;
}

// Non-LCC fares are held before payment rather than ticketed instantly.
function NonLccTag({ lcc, className = '' }: NonLccTagProps) {
    if (lcc) {
        return null;
    }

    return (
        <Tag color="orange" bordered={false} className={`m-0 text-[10px] font-medium ${className}`}>
            NON-LCC
        </Tag>
    );
}

export default NonLccTag;
