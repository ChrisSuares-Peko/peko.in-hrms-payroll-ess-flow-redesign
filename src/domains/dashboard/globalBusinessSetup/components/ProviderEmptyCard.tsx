import { Empty } from 'antd';

export const ProvidersEmptyState = () => (
    <div style={{ padding: '48px 24px' }}>
        <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
                <div className="text-base font-medium">No exact matches for your criteria</div>
            }
        />
    </div>
);
