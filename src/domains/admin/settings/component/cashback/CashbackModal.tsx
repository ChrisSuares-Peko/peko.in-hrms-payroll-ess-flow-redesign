import { useEffect, useMemo, useRef, useState } from 'react';

import { Flex, Form, Skeleton } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formatNumberWithoutCommas } from '@utils/priceFormat';

import { ACCOUNTING_PORTAL_ONLY } from '../../../utils/commissionValidation';
import useUpdateCashback from '../../hooks/useUpdateCashback';
import cashbackSchema from '../../schema/cashbackSchema';
import { ServiceData, refresh, ServiceProvider } from '../../types/cashback';

type CashbackModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: ServiceData;
    handlePartnerChange: (e: string) => void;
    partnerId?: string;
    CategoryData: any;
};

const CashbackModal = ({
    open,
    handleCancel,
    data,
    setRefresh,
    packageData,
    serviceData,
    handlePartnerChange,
    partnerId,
    CategoryData,
}: CashbackModalProps & refresh) => {
    const dispatch = useAppDispatch();
    const { createNewCashback, updateCurrentCashback, isLoading, getCashbackServiceProvider } =
        useUpdateCashback();
    const { partnerData } = usePartnersForCorporate('');
    const [serviceDatas, setServiceDatas] = useState<{ value: String; label: string }[]>([]);
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
        partnerId || 'default'
    );
    const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
        data?.packageId ? String(data.packageId) : null
    );
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (partnerId) setSelectedPartnerId(partnerId);
        if (data?.packageId) setSelectedPackageId(data.packageId.toString());
        if (data?.serviceOperator && isFirstRender.current) {
            setServiceDatas([
                {
                    value: data.serviceOperatorId.toString(),
                    label: data.serviceOperator.serviceProvider,
                },
            ]);
            isFirstRender.current = false;
        }
    }, [partnerId, data]);

    const serviceCategories = useMemo(() => {
        if (!CategoryData) return [];

        const uniqueCategories = new Map();

        CategoryData.forEach((item: any) => {
            if (!uniqueCategories.has(item.label)) {
                uniqueCategories.set(item.label, { label: item.label, value: item.value });
            }
        });

        return Array.from(uniqueCategories.values());
    }, [CategoryData]);

    const getIdsByLabel = (label: string) =>
        CategoryData.filter((item: any) => item.label === label).map((item: any) => item.value);

    const handleCategoryChange = async (value: string) => {
        const ids = getIdsByLabel(value);
        const res: any = await getCashbackServiceProvider(
            ids,
            selectedPartnerId,
            selectedPackageId
        );
        if (res.data) {
            const arr = res.data.map((item: ServiceProvider) => ({
                value: item.id.toString(),
                label: item.serviceProvider,
            }));
            setServiceDatas(arr);
        }
        if (res === false) {
            setServiceDatas([]);
        }
    };
    return (
        <CustomModalWithForm
            reinitialise={!isLoading}
            modalTitle="Cashback Management"
            open={open}
            validationSchema={cashbackSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let res: any;
                const submissionData = { ...values };
                delete submissionData.serviceCategory;
                delete submissionData.partnerId;
                if (data) {
                    res = await updateCurrentCashback({
                        ...submissionData,
                        packageId: data?.packageId.toString(),
                    });
                } else {
                    res = await createNewCashback({
                        ...submissionData,
                    });
                }
                if (res.status === true) {
                    setRefresh(prevRefresh => !prevRefresh);
                    if (data)
                        dispatch(
                            showToast({
                                description: `Cashback updated successfully`,
                                variant: 'success',
                            })
                        );
                    else
                        dispatch(
                            showToast({
                                description: `Cashback added successfully`,
                                variant: 'success',
                            })
                        );
                    handleCancel();
                    handlePartnerChange('');
                }
                if (res.status === false) {
                    dispatch(
                        showToast({
                            description: `${res.message}`,
                            variant: 'error',
                        })
                    );
                }
            }}
            initialValues={{
                id: data?.id || '',
                packageId: data?.packageId != null ? String(data.packageId) : '',
                serviceOperatorId: data?.serviceOperatorId?.toString() || '',
                serviceCategory: data?.serviceCategory?.toString() || '',
                cashbackType: data?.cashbackType || 'PERCENTAGE',
                surchargeType: data?.surchargeType || 'PERCENTAGE',
                cashback: formatNumberWithoutCommas(data?.cashback ?? 0) || '', // data?.cashback
                surcharge: formatNumberWithoutCommas(data?.surcharge ?? 0) || '0',
                unitPrice: formatNumberWithoutCommas(data?.unitPrice) || '0',
                baseLimit: formatNumberWithoutCommas(data?.baseLimit) || '0',
                // Map row → select value: partner-specific rows use the numeric
                // partnerId as a string; Default rows (no partnerId in DB) use the
                // literal 'default' that the Partner select option carries.
                partnerId: data?.partnerId ? String(data.partnerId) : 'default',
            }}
        >
            {({ values, setFieldValue }) => (
                <Flex vertical className="w-full ">
                    <Form layout="vertical">
                        {partnerData && (
                            <SelectInput
                                name="partnerId"
                                options={partnerData.map(p => ({
                                    ...p,
                                    value: String(p.value),
                                }))}
                                placeholder="Please select a partner"
                                label="Select Partner"
                                handleChange={(e: string) => {
                                    handlePartnerChange(e);
                                    setSelectedPartnerId(e);
                                    setFieldValue('packageId', '');
                                    setFieldValue('serviceCategory', '');
                                    setFieldValue('serviceOperatorId', '');
                                }}
                                isRequired
                            />
                        )}
                        {packageData && (
                            <SelectInput
                                isRequired
                                name="packageId"
                                options={packageData}
                                placeholder="Please select a package"
                                label="Package Name"
                                handleChange={e => {
                                    setSelectedPackageId(e);
                                    setFieldValue('serviceCategory', '');
                                    setFieldValue('serviceOperatorId', '');
                                }}
                                showToolTip
                                tooltipText="The default packages are for the Peko platform. If you want to assign cashback for partners, please select the dropdown above first."
                            />
                        )}
                        {serviceCategories ? (
                            <SelectInput
                                isRequired
                                name="serviceCategory"
                                options={serviceCategories.map(item => ({
                                    label: item.label,
                                    value: item.label,
                                }))}
                                // options={serviceCategories}
                                placeholder="Please select service categories"
                                label="Service Category"
                                handleChange={e => {
                                    setFieldValue('serviceOperatorId', '');
                                    handleCategoryChange(e);
                                }}
                            />
                        ) : (
                            <Skeleton.Input active block className="my-2" />
                        )}
                        {!data?.serviceOperatorId && (
                            <SelectInput
                                isRequired
                                name="serviceOperatorId"
                                options={serviceDatas}
                                placeholder="Please select an operator"
                                label="Select Operator"
                            />
                        )}

                        {serviceData?.length && data?.serviceOperatorId && (
                            <SelectInput
                                isRequired
                                name="serviceOperatorId"
                                options={serviceDatas}
                                placeholder="Please select an operator"
                                handleChange={e => {
                                    const selectedItem = serviceDatas.find(
                                        item => item.value === String(e)
                                    );
                                    if (selectedItem)
                                        setFieldValue('serviceOperatorId', selectedItem.value);
                                }}
                                label="Select Operator"
                            />
                        )}

                        <SelectInput
                            name="cashbackType"
                            isRequired
                            options={[
                                { value: 'PERCENTAGE', label: 'Percentage' },
                                { value: 'FLAT', label: 'Flat' },
                            ]}
                            placeholder="Please select a cashback type"
                            label="Cashback Type"
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />

                        <TextInput
                            allowTwoDecimalsOnly
                            maxLength={8}
                            name="cashback"
                            label="Cashback"
                            type="text"
                            placeholder="Please enter cashback "
                            isRequired
                            classes=" rounded-sm"
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />
                        <SelectInput
                            name="surchargeType"
                            isRequired
                            options={[
                                { value: 'PERCENTAGE', label: 'Percentage' },
                                { value: 'FLAT', label: 'Flat' },
                            ]}
                            placeholder="Please select surcharge type"
                            label="Surcharge Type"
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />
                        <TextInput
                            allowTwoDecimalsOnly
                            maxLength={8}
                            name="surcharge"
                            label="Surcharge"
                            type="text"
                            placeholder="Please enter surcharge"
                            isRequired
                            classes=" rounded-sm"
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />
                        <TextInput
                            allowDecimalsOnly
                            name="unitPrice"
                            label="Unit Price"
                            type="text"
                            placeholder="Please enter unit price "
                            classes=" rounded-sm"
                            maxLength={5}
                            isDisabled
                            showToolTip
                            tooltipText={`Unit price for subscription add-ons. ${ACCOUNTING_PORTAL_ONLY}`}
                        />
                        <TextInput
                            allowDecimalsOnly
                            name="baseLimit"
                            label="Base Limit"
                            type="text"
                            placeholder="Please enter base limit "
                            classes=" rounded-sm"
                            maxLength={5}
                            isDisabled
                            showToolTip
                            tooltipText={`The base limit for subscription add-ons: for example, payroll for 20 employees is free with the package. ${ACCOUNTING_PORTAL_ONLY}`}
                        />
                    </Form>
                </Flex>
            )}
        </CustomModalWithForm>
    );
};

export default CashbackModal;
