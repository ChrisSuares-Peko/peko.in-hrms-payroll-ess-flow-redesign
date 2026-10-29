import { MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, Tooltip } from 'antd';

import { ClassifiedOperator, ServiceClassificationTab } from '../../types/serviceClassification';
import { NO_PERMISSION_TEXT, TAB_LABELS, otherTabs } from '../../utils/serviceClassification';

export const REMOVE_CLASSIFICATION_LABEL = 'Remove classification';

export const moveLabel = (target: ServiceClassificationTab) => `Move to ${TAB_LABELS[target]}`;

type Props = {
    record: ClassifiedOperator;
    tab: ServiceClassificationTab;
    canUpdate: boolean;
    busy: boolean;
    onMove: (record: ClassifiedOperator, target: ServiceClassificationTab) => void;
    onRemove: (record: ClassifiedOperator) => void;
};

const ClassificationRowMenu = ({ record, tab, canUpdate, busy, onMove, onRemove }: Props) => (
    <Tooltip title={canUpdate ? '' : NO_PERMISSION_TEXT}>
        <span className="inline-flex">
            <Dropdown
                disabled={!canUpdate || busy}
                trigger={['click']}
                menu={{
                    items: [
                        ...otherTabs(tab).map(target => ({
                            key: `move-${target}`,
                            label: moveLabel(target),
                            onClick: () => onMove(record, target),
                        })),
                        {
                            key: 'remove',
                            label: REMOVE_CLASSIFICATION_LABEL,
                            danger: true,
                            onClick: () => onRemove(record),
                        },
                    ],
                }}
            >
                <Button
                    type="text"
                    icon={<MoreOutlined />}
                    loading={busy}
                    disabled={!canUpdate}
                    aria-label={`Actions for ${record.serviceProvider}`}
                />
            </Dropdown>
        </span>
    </Tooltip>
);

export default ClassificationRowMenu;
