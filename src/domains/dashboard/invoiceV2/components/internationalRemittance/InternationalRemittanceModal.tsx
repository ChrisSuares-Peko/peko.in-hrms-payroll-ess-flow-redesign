import React, { useState } from 'react';

import { CheckCircleFilled, CheckCircleOutlined } from '@ant-design/icons';
import { Flex, Modal, Typography } from 'antd';

import CompanyDetails from './CompanyDetails';
import Complete from './Complete';
import Wellcome from './Wellcome';

interface InternationalRemittanceModalProps {
    open: boolean;
    onClose: () => void;
}

const STEPS = ['Welcome', 'Company Details', 'Complete'];

const InternationalRemittanceModal: React.FC<InternationalRemittanceModalProps> = ({
    open,
    onClose,
}) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleClose = () => {
        setCurrentStep(0);
        onClose();
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            width={620}
            centered
            destroyOnHidden
            closable={false}
            styles={{
                content: { borderRadius: 20, padding: 0, overflow: 'hidden' },
                body: { padding: 0 },
            }}
        >
            {/* Stepper header */}
            <Flex gap={30} className="border-b border-[#E4E4E7] mx-9 pt-4">
                {STEPS.map((label, index) => {
                    const isActive = currentStep === index;
                    const isDone = index < currentStep;
                    let labelColor = 'text-[#A1A1AA]';
                    if (isActive) labelColor = 'text-[#FF4F4F] font-medium';
                    else if (isDone) labelColor = 'text-[#FF4F4F]';
                    return (
                        <Flex
                            key={label}
                            align="center"
                            gap={6}
                            className={`py-3 ${isActive ? 'border-b-2 border-[#FF4F4F] -mb-px' : ''}`}
                        >
                            {isDone ? (
                                <CheckCircleFilled className="text-base text-[#FF4F4F]" />
                            ) : (
                                <CheckCircleOutlined
                                    className={`text-base ${isActive ? 'text-[#FF4F4F]' : 'text-[#A1A1AA]'}`}
                                />
                            )}
                            <Typography.Text className={`text-sm ${labelColor}`}>
                                {label}
                            </Typography.Text>
                        </Flex>
                    );
                })}
            </Flex>

            {/* Step content */}
            <Flex
                vertical
                className="px-6 pb-6 pt-2"
                style={{ overflowY: 'auto', maxHeight: 'calc(85vh - 80px)' }}
            >
                {currentStep === 0 && (
                    <Wellcome onSkip={handleClose} onProceed={() => setCurrentStep(1)} />
                )}
                {currentStep === 1 && (
                    <CompanyDetails
                        onSkip={() => setCurrentStep(0)}
                        onProceed={() => setCurrentStep(2)}
                    />
                )}
                {currentStep === 2 && <Complete onClose={handleClose} />}
            </Flex>
        </Modal>
    );
};

export default React.memo(InternationalRemittanceModal);
