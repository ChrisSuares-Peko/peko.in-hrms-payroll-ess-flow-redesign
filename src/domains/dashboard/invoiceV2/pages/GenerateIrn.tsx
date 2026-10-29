import { useCallback, useEffect, useRef, useState } from 'react';


import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Button, Flex, Tag } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import TypographyText from '@components/atomic/typography/typographyText';
import { paths } from '@routes/paths';
import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';

import { getAllCustomersForSelect } from '../api/invoices';
import BuyerStep from '../components/generateIrn/BuyerStep';
import IrnStepper from '../components/generateIrn/IrnStepper';
import ItemsStep from '../components/generateIrn/ItemsStep';
import ReviewStep from '../components/generateIrn/ReviewStep';
import SellerStep from '../components/generateIrn/SellerStep';
import TransactionStep from '../components/generateIrn/TransactionStep';
import {
    FORM_STEP_TO_DISPLAY,
    STEP_TITLES,
    defaultBuyerValues,
    defaultItemsValues,
    defaultSellerValues,
    defaultTransactionValues,
} from '../constants/generateIrn';
import useGenerateIrn from '../hooks/generateIrn/useGenerateIrn';
import useIrnSettings from '../hooks/generateIrn/useIrnSettings';
import useIndianStates from '../hooks/useIndianStates';
import { clearPrefilledIrn } from '../slices/eInvoiceIrnSlice';
import { CustomerOption } from '../types/createInvoice';
import {
    BuyerFormValues,
    GenerateIrnFormState,
    ItemsFormValues,
    SellerFormValues,
    StepHandle,
    TransactionFormValues,
} from '../types/generateIrn';

const TOTAL_STEPS = 5;

const GenerateIrn = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const prefilled = useAppSelector(state => state.reducer.eInvoiceIrn.prefilled);
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const {
        prefixMap,
        sellerDefaults,
        nextNumber,
        isNextNumberLoading,
        isSettingsLoading,
        isSellerDefaultsLoading,
        fetchSellerDefaults,
    } = useIrnSettings();
    const { submitIrn, isSubmitting } = useGenerateIrn();
    const { stateOptions, isLoading: isLoadingStates, fetchStates } = useIndianStates({ autoFetch: false });
    const [customers, setCustomers] = useState<CustomerOption[]>([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const hasFetchedCustomers = useRef(false);

    const fetchCustomers = useCallback(async () => {
        if (hasFetchedCustomers.current) return;
        setIsLoadingCustomers(true);
        const data = await getAllCustomersForSelect({ userId: id, userType: role });
        if (data) setCustomers(data);
        hasFetchedCustomers.current = true;
        setIsLoadingCustomers(false);
    }, [id, role]);
    const [formStep, setFormStep] = useState(0);
    const [formState, setFormState] = useState<GenerateIrnFormState>({
        invoiceId: prefilled?.invoiceId,
        transaction: { ...defaultTransactionValues, ...prefilled?.transaction, documentDate: dayjs().format('YYYY-MM-DD') },
        seller: { ...defaultSellerValues, ...prefilled?.seller },
        buyer: { ...defaultBuyerValues, ...prefilled?.buyer },
        items: prefilled?.items ?? defaultItemsValues,
    });

    useEffect(() => {
        if (!prefilled) {
            setFormState(s => ({
                ...s,
                seller: {
                    sellerGstin: s.seller.sellerGstin || sellerDefaults.sellerGstin,
                    legalName: s.seller.legalName || sellerDefaults.legalName,
                    tradeName: s.seller.tradeName || sellerDefaults.tradeName,
                    address1: s.seller.address1 || sellerDefaults.address1,
                    location: s.seller.location || sellerDefaults.location,
                    pinCode: s.seller.pinCode || sellerDefaults.pinCode,
                    state: s.seller.state || sellerDefaults.state,
                },
            }));
        }
    }, [sellerDefaults, prefilled]);

    useEffect(() => {
        if (prefilled) dispatch(clearPrefilledIrn());
    }, [prefilled, dispatch]);

    const transactionRef = useRef<StepHandle>(null);
    const sellerRef = useRef<StepHandle>(null);
    const buyerRef = useRef<StepHandle>(null);
    const itemsRef = useRef<StepHandle>(null);

    const handleCancel = () => {
        navigate(`/${paths.invoice.index}/${paths.invoice.eInvoicing}`);
    };

    const handleBack = () => {
        if (formStep === 0) {
            navigate(`/${paths.invoice.index}/${paths.invoice.convertToEInvoice}`);
        } else if (formStep === 1) {
            const values = sellerRef.current?.getValues() as SellerFormValues | undefined;
            if (values) setFormState(s => ({ ...s, seller: values }));
            setFormStep(0);
        } else if (formStep === 2) {
            const values = buyerRef.current?.getValues() as BuyerFormValues | undefined;
            if (values) setFormState(s => ({ ...s, buyer: values }));
            setFormStep(1);
        } else if (formStep === 3) {
            const values = itemsRef.current?.getValues() as ItemsFormValues | undefined;
            if (values) setFormState(s => ({ ...s, items: values }));
            setFormStep(2);
        } else {
            setFormStep(s => s - 1);
        }
    };

    const handleContinue = async () => {
        if (formStep === 0) {
            await transactionRef.current?.submit();
        } else if (formStep === 1) {
            await sellerRef.current?.submit();
        } else if (formStep === 2) {
            await buyerRef.current?.submit();
        } else if (formStep === 3) {
            await itemsRef.current?.submit();
        } else if (formStep === 4) {
            await submitIrn(formState);
        }
    };

    const handleTransactionNext = (values: TransactionFormValues) => {
        setFormState(s => ({ ...s, transaction: values }));
        fetchStates();
        fetchSellerDefaults();
        setFormStep(1);
    };

    const handleSellerNext = (values: SellerFormValues) => {
        setFormState(s => ({ ...s, seller: values }));
        fetchCustomers();
        setFormStep(2);
    };

    const handleBuyerNext = (values: BuyerFormValues) => {
        setFormState(s => ({ ...s, buyer: values }));
        setFormStep(3);
    };

    const handleItemsNext = (values: ItemsFormValues) => {
        setFormState(s => ({ ...s, items: values }));
        setFormStep(4);
    };

    const displayStep = FORM_STEP_TO_DISPLAY[formStep];
    const isFinalStep = formStep === 4;
    const useIgst =
        formState.transaction.igstOnIntra ||
        (!!formState.seller.state &&
            !!formState.buyer.placeOfSupply &&
            formState.seller.state !== formState.buyer.placeOfSupply);

    return (
        <Content className="px-0">
            {/* Header */}
            <Flex justify="space-between" align="center" className="mb-7">
                <Flex vertical gap={4}>
                    <TypographyText className="text-xl md:text-2xl font-semibold">
                        Generate IRN
                    </TypographyText>
                    <TypographyText className="text-[#475467] text-sm md:text-base font-normal leading-6">
                        Create and register an e-invoice with GSTN
                    </TypographyText>
                </Flex>
                <Button onClick={handleCancel} className="border-[#FF4F4F] text-[#FF4F4F]">
                    Cancel
                </Button>
            </Flex>

            {/* Card */}
            <Flex
                vertical
                gap={6}
                className="bg-white border border-[#E4E4E7] rounded-2xl p-6 md:p-8"
            >
                {/* Stepper */}
                <IrnStepper currentFormStep={formStep} />

                {/* Step content */}
                <Flex vertical gap={5} className="mt-6">
                    <Flex align="center" justify="space-between" className="pb-2">
                        <TypographyText className="text-base font-semibold">
                            {STEP_TITLES[formStep]}
                        </TypographyText>
                        {formStep === 3 && (
                            <Tag color="blue" className="text-sm px-3 py-1 rounded-full m-0">
                                {useIgst ? 'IGST Mode' : 'CGST + SGST Mode'}
                            </Tag>
                        )}
                    </Flex>
                    {formStep === 0 && (
                        <TransactionStep
                            ref={transactionRef}
                            initialValues={formState.transaction}
                            prefixMap={prefixMap}
                            nextNumber={nextNumber}
                            isNextNumberLoading={isNextNumberLoading}
                            isSettingsLoading={isSettingsLoading}
                            onNext={handleTransactionNext}
                        />
                    )}
                    {formStep === 1 && (
                        <SellerStep
                            ref={sellerRef}
                            initialValues={formState.seller}
                            stateOptions={stateOptions}
                            isLoadingStates={isLoadingStates}
                            isSellerDefaultsLoading={isSellerDefaultsLoading}
                            onNext={handleSellerNext}
                        />
                    )}
                    {formStep === 2 && (
                        <BuyerStep
                            ref={buyerRef}
                            initialValues={formState.buyer}
                            stateOptions={stateOptions}
                            isLoadingStates={isLoadingStates}
                            customers={customers}
                            isLoadingCustomers={isLoadingCustomers}
                            onNext={handleBuyerNext}
                        />
                    )}
                    {formStep === 3 && (
                        <ItemsStep
                            ref={itemsRef}
                            initialValues={formState.items}
                            onNext={handleItemsNext}
                            igstOnIntra={useIgst}
                        />
                    )}
                    {formStep === 4 && (
                        <ReviewStep
                            transaction={formState.transaction}
                            seller={formState.seller}
                            buyer={formState.buyer}
                            items={formState.items}
                        />
                    )}
                </Flex>

                {/* Footer navigation */}
                <Flex
                    justify="space-between"
                    align="center"
                    className="mt-6 pt-5 border-t border-[#E4E4E7]"
                >
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={handleBack}
                        className="border-[#FF4F4F] text-[#FF4F4F]"
                    >
                        Back
                    </Button>
                    <TypographyText className="text-sm text-[#475467]">
                        Step {displayStep} of {TOTAL_STEPS}
                    </TypographyText>
                    <Button type="primary" danger loading={isSubmitting} onClick={handleContinue}>
                        <Flex align="center" gap={6}>
                            {isFinalStep ? 'Generate IRN' : 'Continue'}
                            {!isFinalStep && <ArrowRightOutlined />}
                        </Flex>
                    </Button>
                </Flex>
            </Flex>
        </Content>
    );
};

export default GenerateIrn;
