import { InfoCircleOutlined, LockOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Skeleton, Typography } from 'antd';
import { Formik } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';

import { KybChecklistDocument } from '../../../api/admin/kybStatusApi';
import DocumentIcon from '../../../assets/icons/document.svg';
import { initiateKybSchema } from '../../../schema/initiateKybSchema';
import { DEFAULT_BUSINESS_TYPE, KYB_INTRO } from '../../../utils/kybData';
import GoBackButton from '../../common/GoBackButton';

const { Title, Text } = Typography;

interface InitiateKybValues {
    businessType?: string;
}

interface InitiateKybProps {
    onInitiate: (businessType: string) => void;
    onBack: () => void;
    businessType?: string;
    options: { label: string; value: string }[];
    documentsFor: (businessType?: string) => KybChecklistDocument[];
    isLoading?: boolean;
    failed?: boolean;
    onRetry?: () => void;
    submitLoading?: boolean;
}

const InitiateKyb = ({
    onInitiate,
    onBack,
    businessType,
    options,
    documentsFor,
    isLoading,
    failed,
    onRetry,
    submitLoading,
}: InitiateKybProps) => (
    <Formik<InitiateKybValues>
        initialValues={{
            businessType:
                businessType ??
                (options.some(option => option.value === DEFAULT_BUSINESS_TYPE)
                    ? DEFAULT_BUSINESS_TYPE
                    : undefined),
        }}
        enableReinitialize
        validationSchema={initiateKybSchema}
        validateOnMount
        onSubmit={values => {
            if (typeof Moengage?.track_event === 'function') {
                Moengage.track_event('initiate_kyb_clicked', {
                    type_of_business: values.businessType,
                });
            }
            onInitiate(values.businessType as string);
        }}
    >
        {({ submitForm, isValid, values }) => {
            const documents = documentsFor(values.businessType);

            return (
                <Form
                    layout="vertical"
                    onFinish={submitForm}
                    className="mx-auto flex w-full max-w-3xl flex-col gap-5 pb-4 pt-1 sm:gap-8 xl:pb-8 xl:pt-2"
                >
                    <GoBackButton onClick={onBack} />

                    <div className="flex flex-col items-center gap-3 text-center sm:gap-4">
                        <span className="rounded-full bg-bgLightPink px-3 py-1 text-xs text-textLightRed sm:px-4 sm:py-1.5 sm:text-sm">
                            {KYB_INTRO.badge}
                        </span>
                        <Title level={3} className="!mb-0 !text-xl !text-textHeadings sm:!text-2xl">
                            {KYB_INTRO.title}
                        </Title>
                        <Text className="text-sm text-textBody sm:px-12 sm:text-base">
                            {KYB_INTRO.description}
                        </Text>
                    </div>

                    {failed && (
                        <Alert
                            type="error"
                            showIcon
                            message={KYB_INTRO.checklistUnavailable}
                            action={
                                <Button size="small" danger onClick={onRetry}>
                                    {KYB_INTRO.retryLabel}
                                </Button>
                            }
                        />
                    )}

                    <div className="rounded-2xl border border-borderGray bg-white p-4 sm:rounded-3xl sm:p-6 xl:p-9">
                        <SelectInput
                            name="businessType"
                            label={KYB_INTRO.businessTypeLabel}
                            placeholder={KYB_INTRO.businessTypePlaceholder}
                            options={options}
                            isDisabled={isLoading || failed}
                            isRequired
                            formItemClass="!mb-0"
                        />
                    </div>

                    <div className="flex flex-col gap-4 rounded-2xl border border-borderGray bg-white p-4 sm:gap-5 sm:rounded-3xl sm:p-6 xl:p-9">
                        <Text className="text-base font-medium text-textHeadings sm:text-lg">
                            {KYB_INTRO.checklistTitle}
                        </Text>

                        {isLoading && <Skeleton active paragraph={{ rows: 6 }} />}

                        {!isLoading && documents.length === 0 && (
                            <Text className="text-xs text-textGreyLight sm:text-sm">
                                {KYB_INTRO.checklistEmpty}
                            </Text>
                        )}

                        {documents.length > 0 && (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                                {documents.map(doc => (
                                    <div
                                        key={doc.key}
                                        className="flex items-center gap-3 rounded-xl border border-borderGray bg-white px-3 py-3 sm:rounded-2xl sm:px-4 sm:py-3.5"
                                    >
                                        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 sm:size-11">
                                            <img
                                                src={DocumentIcon}
                                                alt=""
                                                className="block size-4 object-contain sm:size-5"
                                            />
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                                            <Text className="text-xs font-medium text-textHeadings sm:text-sm">
                                                {doc.label}
                                                {!doc.required && (
                                                    <span className="ml-1 font-normal text-textGreyLight">
                                                        {KYB_INTRO.optionalSuffix}
                                                    </span>
                                                )}
                                            </Text>
                                            <Text className="text-[11px] leading-snug text-textGreyLight">
                                                {doc.hint}
                                            </Text>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
                        {KYB_INTRO.infoNotes.map(note => (
                            <div key={note} className="flex items-start gap-2 sm:gap-3">
                                <InfoCircleOutlined className="mt-0.5 shrink-0 text-amber-600" />
                                <Text className="text-xs text-amber-700 sm:text-sm">{note}</Text>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col items-center gap-3 sm:gap-4">
                        <Button
                            type="primary"
                            block
                            htmlType="submit"
                            loading={submitLoading}
                            disabled={!isValid || documents.length === 0}
                            className="!h-12 text-sm font-medium sm:!h-14 sm:text-base"
                        >
                            {KYB_INTRO.ctaLabel}
                        </Button>
                        <span className="flex items-center gap-1.5 text-xs text-textBody">
                            <LockOutlined />
                            {KYB_INTRO.securityNote}
                        </span>
                    </div>
                </Form>
            );
        }}
    </Formik>
);

export default InitiateKyb;
