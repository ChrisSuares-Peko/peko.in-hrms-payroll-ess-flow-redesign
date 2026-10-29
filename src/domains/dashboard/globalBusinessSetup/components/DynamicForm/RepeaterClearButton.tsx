import React from 'react';

import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { getIn, useFormikContext } from 'formik';

import { isInstanceFilled } from './RepeaterSummary';
import { ISection } from '../../types/forms';

interface RepeaterClearButtonProps {
    section: ISection;
    pageId: string;
    sectionId: string;
    instanceCount: number;
    noun: string;
    // Parent resets to the correct blank count (per repeater type) via its
    // replaceInstances primitive.
    onClear: () => void;
}

/**
 * "Clear All" for a repeater section — shown only when at least one instance
 * has user-entered data. Confirms, then asks the parent to swap all instances
 * for blanks. Ported (antd) from the vendor's RepeaterClearButton.
 */
const RepeaterClearButton: React.FC<RepeaterClearButtonProps> = ({
    section,
    pageId,
    sectionId,
    instanceCount,
    noun,
    onClear,
}) => {
    const { values } = useFormikContext<any>();
    const [modal, contextHolder] = Modal.useModal();

    const sectionPath = `pages.${pageId}.${sectionId}`;
    const hasData = Array.from({ length: instanceCount }, (_, i) => i).some(i => {
        const instanceValues =
            (getIn(values, `${sectionPath}.${i}`) as Record<string, unknown>) || {};
        return isInstanceFilled(section, instanceValues);
    });

    if (!hasData) return null;

    const confirmClear = () => {
        modal.confirm({
            title: `Clear all ${noun.toLowerCase()} details?`,
            icon: <ExclamationCircleOutlined />,
            content: 'All entered details in this section will be removed. This cannot be undone.',
            okText: 'Clear All',
            okButtonProps: { danger: true },
            cancelText: 'Cancel',
            onOk: onClear,
        });
    };

    return (
        <>
            {contextHolder}
            <Button danger icon={<DeleteOutlined />} onClick={confirmClear}>
                Clear All
            </Button>
        </>
    );
};

export default RepeaterClearButton;
