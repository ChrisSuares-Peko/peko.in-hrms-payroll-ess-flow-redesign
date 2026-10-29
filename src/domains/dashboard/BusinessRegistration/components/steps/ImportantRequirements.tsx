import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { useFormikContext } from 'formik';

import { EntityType } from '../../types';
import { IMPORTANT_REQUIREMENTS, PARTNERSHIP_IMPORTANT_REQUIREMENTS } from '../../utils/proprietorKyc';

const { Text } = Typography;

// Shared "Important Requirements" callout on the KYC steps. Partnership swaps the
// promoter/director wording for "partner".
const ImportantRequirements = () => {
    const { values } = useFormikContext<{ entityType?: EntityType }>();
    const items =
        values.entityType === EntityType.PARTNERSHIP
            ? PARTNERSHIP_IMPORTANT_REQUIREMENTS
            : IMPORTANT_REQUIREMENTS;
    return (
        <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[12px] flex gap-2 items-start px-4 py-3">
            <ExclamationCircleOutlined className="text-[#f59e0b] mt-[3px]" style={{ fontSize: 16 }} />
            <div>
                <Text className="!block !text-[14px] !font-medium !text-[#1e293b] !mb-1">
                    Important Requirements:
                </Text>
                <ul className="list-disc pl-4 flex flex-col gap-1">
                    {items.map(req => (
                        <li key={req} className="text-[13px] text-[#475569] leading-[20px]">
                            {req}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ImportantRequirements;
