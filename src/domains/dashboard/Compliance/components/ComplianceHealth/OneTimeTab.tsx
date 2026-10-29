import { Flex, Typography } from 'antd';

import { SectionGroup } from './SectionGroup';
import { type ComplianceSectionMeta, type ComplianceHealthItem } from '../../utils/data';

const { Text } = Typography;

interface OneTimeTabProps {
    sections: (ComplianceSectionMeta & { items: ComplianceHealthItem[] })[];
}

export function OneTimeTab({ sections }: OneTimeTabProps) {
    if (sections.length === 0) {
        return (
            <Flex justify="center" align="center" className="py-20">
                <Text className="!text-[16px] !text-[#6a7282]">
                    No compliance items found for the selected filters.
                </Text>
            </Flex>
        );
    }

    return (
        <Flex vertical gap={24}>
            {sections.map((sec) => (
                <SectionGroup
                    key={sec.key}
                    sectionKey={sec.key}
                    label={sec.label}
                    iconType={sec.iconType}
                    items={sec.items}
                />
            ))}
        </Flex>
    );
}
