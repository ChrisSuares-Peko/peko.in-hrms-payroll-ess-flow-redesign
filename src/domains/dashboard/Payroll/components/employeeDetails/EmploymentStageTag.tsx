import { Flex, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import type { EmploymentStage, EmploymentStageKey } from '../../types/types';

export const EMPLOYMENT_STAGE_TAGS: Record<EmploymentStageKey, { bg: string; color: string; label: string }> = {
    ON_PROBATION: { bg: '#FFF7E6', color: '#D48806', label: 'On probation' },
    PROBATION_REVIEW_DUE: { bg: '#FFF1F0', color: '#FF4D4F', label: 'Probation review due' },
    CONFIRMED: { bg: '#F6FFED', color: '#52C41A', label: 'Confirmed' },
    NOTICE_PERIOD: { bg: '#FFF7E6', color: '#FAAD14', label: 'Notice period' },
    EXITED: { bg: '#F5F5F5', color: '#595959', label: 'Exited' },
};

const formatDate = (date?: string | null) => (date ? dayjs(date).format('D MMM YYYY') : '');

// The date that matters for each status, e.g. "ends 3 Nov 2026 · 27 days" or "ended 15 Sep 2026".
export const employmentStageDetail = ({ stage, probationEndDate, daysLeft, confirmationDate, lastWorkingDay }: EmploymentStage) => {
    switch (stage) {
        case 'ON_PROBATION':
            return `ends ${formatDate(probationEndDate)}${daysLeft !== undefined && daysLeft <= 30 ? ` · ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}` : ''}`;
        case 'PROBATION_REVIEW_DUE':
            return `ended ${formatDate(probationEndDate)}`;
        case 'CONFIRMED':
            return confirmationDate ? `on ${formatDate(confirmationDate)}` : '';
        default:
            return lastWorkingDay ? `last day ${formatDate(lastWorkingDay)}` : '';
    }
};

type Props = {
    employmentStage: EmploymentStage;
    /** Show the date line under the chip (the list does; the profile header doesn't). */
    showDetail?: boolean;
};

const EmploymentStageTag = ({ employmentStage, showDetail = true }: Props) => {
    const tag = EMPLOYMENT_STAGE_TAGS[employmentStage.stage];
    if (!tag) return null;
    const detail = showDetail ? employmentStageDetail(employmentStage) : '';

    return (
        <Flex vertical gap={2}>
            <Tag
                color={tag.bg}
                style={{
                    color: tag.color,
                    borderRadius: 50,
                    height: '22px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingInline: 10,
                    width: 'fit-content',
                    marginInlineEnd: 0,
                }}
            >
                ● {tag.label}
            </Tag>
            {detail && (
                <Typography.Text className="text-xs" style={{ color: '#94A3B8' }}>
                    {detail}
                </Typography.Text>
            )}
        </Flex>
    );
};

export default EmploymentStageTag;
