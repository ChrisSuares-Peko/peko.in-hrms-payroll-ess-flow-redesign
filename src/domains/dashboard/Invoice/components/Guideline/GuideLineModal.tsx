import React, { useState } from 'react';

import { Modal, Tabs, TabsProps } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { FormikValues, useFormikContext } from 'formik';

import EmailTemplate from './EmailTemplate';
import SmsTemplate from './SmsTemplate';
import { Row, Rows } from '../../types/guidelineTypes';

interface modalProps {
    handleCancel: () => void;
    open: boolean;
    index: number;
    templateData: Row[] | Rows[];
}

const GuideLineModal = ({ handleCancel, open, index, templateData }: modalProps) => {
    const { values } = useFormikContext<FormikValues>();
    const [activeTabKey, setActiveTabKey] = useState(values.data[index].email ? '1' : '2');
    const handleFormSubmit = (nextTabKey: string) => {
        setActiveTabKey(nextTabKey);
    };

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Email',
            children: (
                <EmailTemplate
                    index={index}
                    handleCancel={handleCancel}
                    templateData={templateData}
                    onHandleTemplate={() => {
                     
                        handleFormSubmit('2');
                    }}
                />
            ),
            disabled: !values.data[index].email,
            active: values.data[index].email,
        },
        {
            key: '2',
            label: 'SMS',
            children: (
                <SmsTemplate
                    index={index}
                    handleCancel={handleCancel}
                    templateData={templateData}
                />
            ),
            disabled: !values.data[index].sms,
            active: values.data[index].sms,
        },
    ];

    return (
        <Modal title="Setup Template" open={open} onCancel={handleCancel} footer={null} width={800}>
            <Content className="px-4 " style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} items={items} />
            </Content>
        </Modal>
    );
};

export default React.memo(GuideLineModal);
