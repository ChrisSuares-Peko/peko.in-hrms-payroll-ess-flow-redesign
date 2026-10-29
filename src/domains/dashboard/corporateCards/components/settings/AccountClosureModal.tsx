import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Modal, Typography } from 'antd';
import { Formik } from 'formik';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';

import { ClosureReasonOption } from '../../api/admin/accountClosureApi';
import {
    AccountClosureValues,
    accountClosureSchema,
    CLOSURE_DETAILS_MAX,
    CLOSURE_REASON_OTHERS,
} from '../../schema/accountClosureSchema';
import { MODAL_CLOSE_ICON, ROUNDED_MODAL_CLASSNAMES } from '../common/modalProps';

const { Text, Title } = Typography;

const TIGHT_FIELD = '!mb-0';

interface AccountClosureModalProps {
    open: boolean;
    companyName: string;
    reasons: ClosureReasonOption[];
    submitLoading?: boolean;
    onClose: () => void;
    onSubmit: (values: AccountClosureValues) => void | Promise<void>;
}

const AccountClosureModal = ({
    open,
    companyName,
    reasons,
    submitLoading,
    onClose,
    onSubmit,
}: AccountClosureModalProps) => (
    <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        width={560}
        destroyOnHidden
        classNames={ROUNDED_MODAL_CLASSNAMES}
        closeIcon={MODAL_CLOSE_ICON}
    >
        <Formik<AccountClosureValues>
            initialValues={{ reason: '', details: '' }}
            validationSchema={accountClosureSchema}
            validateOnMount
            onSubmit={onSubmit}
        >
            {({ submitForm, isValid, values }) => (
                <Form layout="vertical" className="flex flex-col gap-6" onFinish={submitForm}>
                    <Flex vertical gap={6}>
                        <Title level={4} className="!mb-0 !text-textHeadings">
                            {`Close ${companyName}'s Peko Account`}
                        </Title>
                        <Text className="text-sm text-textBody">
                            Tell us why you&apos;re leaving. This helps us improve Peko.
                        </Text>
                    </Flex>

                    <Flex vertical gap={16}>
                        <Flex vertical gap={6}>
                            <Text className="text-sm text-textBody">
                                Reason for leaving
                                <span className="ml-0.5 text-errorTextRed">*</span>
                            </Text>
                            <SelectInput
                                name="reason"
                                placeholder="Select"
                                options={reasons}
                                formItemClass={TIGHT_FIELD}
                            />
                        </Flex>

                        <Flex vertical gap={6}>
                            <Text className="text-sm text-textBody">
                                {values.reason === CLOSURE_REASON_OTHERS ? (
                                    <>
                                        Additional details
                                        <span className="ml-0.5 text-errorTextRed">*</span>
                                    </>
                                ) : (
                                    'Additional details (optional)'
                                )}
                            </Text>
                            <InputTextArea
                                name="details"
                                placeholder="Enter"
                                autoSize={{ minRows: 3 }}
                                maxLength={CLOSURE_DETAILS_MAX}
                                formItemClass={TIGHT_FIELD}
                            />
                        </Flex>
                    </Flex>

                    <Flex
                        gap={8}
                        align="start"
                        className="rounded-2xl border border-errorTextRed/30 bg-bgLightPink px-5 py-4"
                    >
                        <InfoCircleOutlined className="mt-0.5 shrink-0 text-errorTextRed" />
                        <Text className="text-sm text-errorTextRed">
                            All users will lose access, company data will be deleted, and all
                            Corporate cards will be terminated once support confirms the closure.
                        </Text>
                    </Flex>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Button
                            danger
                            onClick={onClose}
                            disabled={submitLoading}
                            className="!h-11 font-medium"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            disabled={!isValid}
                            loading={submitLoading}
                            onClick={submitForm}
                            className="!h-11 font-medium"
                        >
                            Submit closure request
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    </Modal>
);

export default AccountClosureModal;
