import { useState } from 'react';

import { Modal, Tabs } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { FormikValues, useFormikContext } from 'formik';

import EmailTemplate from './EmailTemplate';
import SmsTemplate from './SmsTemplate';

interface Props {
    handleCancel: () => void;
    open: boolean;
    index: number;
    templateData: any[];
    invoiceDetails: { invoiceNo?: string; dueDate?: string };
    paymentDetails: { amountDue?: string };
    recipientDetails: { customerName?: string; customerPhone?: string; customerEmail?: string };
}

const GuideLineModal = ({
    handleCancel,
    open,
    index,
    templateData,
    invoiceDetails,
    paymentDetails,
    recipientDetails,
}: Props) => {
    const { values } = useFormikContext<FormikValues>();
    const [activeTabKey, setActiveTabKey] = useState(values.data[index]?.email ? '1' : '2');

    const sharedProps = { invoiceDetails, paymentDetails, recipientDetails };

    const items = [
        {
            key: '1',
            label: 'Email',
            disabled: !values.data[index]?.email,
            children: (
                <EmailTemplate
                    index={index}
                    handleCancel={handleCancel}
                    templateData={templateData}
                    onHandleTemplate={() => setActiveTabKey('2')}
                    {...sharedProps}
                />
            ),
        },
        {
            key: '2',
            label: 'SMS',
            disabled: !values.data[index]?.sms,
            children: (
                <SmsTemplate
                    index={index}
                    handleCancel={handleCancel}
                    templateData={templateData}
                    {...sharedProps}
                />
            ),
        },
    ];

    return (
        <Modal
            title={<span className="ml-4">Setup Template</span>}
            open={open}
            onCancel={handleCancel}
            footer={null}
            width={800}
        >
            <Content className="px-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} items={items} />
            </Content>
        </Modal>
    );
};

export default GuideLineModal;
