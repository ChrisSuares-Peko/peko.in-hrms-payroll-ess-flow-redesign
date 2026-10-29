import { Tag } from 'antd';

interface UsageTypeTagProps {
    usageType?: string;
    className?: string;
}

// Maps the API's `usageType` to the small outlined pill shown on the listing
// cards and the details page. Renders nothing when usageType is absent/unknown
// rather than guessing — only shows what the data actually says.
const USAGE_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
    offline: { label: 'In store only', className: 'border-[#ca7900] text-[#ca7900]' },
    online: { label: 'Online', className: 'border-green-500 text-green-600' },
    both: { label: 'Online & In store', className: 'border-green-500 text-green-600' },
};

const UsageTypeTag = ({ usageType, className }: UsageTypeTagProps) => {
    const config = usageType ? USAGE_TYPE_CONFIG[usageType.toLowerCase()] : undefined;
    if (!config) return null;

    return (
        <Tag
            className={`rounded-md bg-white px-3 py-0.5 text-xs font-medium ${config.className} ${className ?? ''}`}
        >
            {config.label}
        </Tag>
    );
};

export default UsageTypeTag;
