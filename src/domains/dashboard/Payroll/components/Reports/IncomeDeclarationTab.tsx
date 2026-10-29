import React, { useEffect, useState } from 'react';

import { Typography, Flex, Form, Spin } from 'antd';
import { Formik } from 'formik';

import ChapterVIADeductionsSection from './ChapterVIADeductionsSection';
import EmployeeAndFinancialYearSelector from './EmployeeAndFinancialYearSelector';
import HomeLoanDeductionsSection from './HomeLoanDeductionsSection';
import HomeLoanSection from './HomeLoanSection';
import HRASection from './HRASection';
import IncomeDeclarationSection from './IncomeDeclarationSection';
import LTASection from './LTASection';
import SummaryAndActionsSection from './SummaryAndActionsSection';
import useIncomeDeclarationApi from '../../hooks/reports/useIncomeDeclarationApi';
import { incomeDeclarationSchema } from '../../schema/reportandForms';

const defaultValues = {
    employee: '',
    financialYear: '2025',
    hraDetails: {
        totalRentPaid: '',
        landlordName: '',
        landlordPAN: '',
        rentedPropertyAddress: '',
        rentReceipts: '',
    },
    ltaDetails: {
        ltaAmountClaimed: '',
        travelDate: '',
        travelDestination: '',
        proofOfTravel: '',
    },
    homeLoanInterestDetails: {
        interestPaid: '',
        lenderName: '',
        lenderPAN: '',
        lenderAddress: '',
        proofOfTravel: '',
    },
    incomeDeclaration: {
        annualIncome: '',
        incomeProof: '',
    },
    chapterVIA: [
        {
            investmentType: '',
            amountInvested: '',
            proof: '',
        },
    ],
    homeLoanDeductions: [
        {
            deductionType: '',
            amountClaimed: '',
            institutionName: '',
            certificationDate: '',
            proof: '',
        },
    ],
};

const IncomeDeclarationTab = () => {
    const {
        incomeDeclarationData,
        isLoading,
        updateIncomeDeclarationForm,
        getIncomeDeclaration,
        buttonLoader,
    } = useIncomeDeclarationApi();

    const [initialValues, setInitialValues] = useState(defaultValues);

    useEffect(() => {
        if (incomeDeclarationData) {
            setInitialValues({
                ...defaultValues,
                ...incomeDeclarationData,
            });
        }
    }, [incomeDeclarationData]);

    return (
        <Flex gap={10} vertical className="w-[75%]">
            <Flex justify="space-between">
                <Typography.Text className="text-[#1B1B1B] font-medium text-[1.2rem]">
                    Income Declaration Form
                </Typography.Text>
            </Flex>
            <Formik
                enableReinitialize
                initialValues={initialValues}
                onSubmit={async values => {
                    await updateIncomeDeclarationForm(values);
                }}
                validationSchema={incomeDeclarationSchema}
            >
                {({ handleSubmit, values, resetForm }) => (
                    <Form layout="vertical" onFinish={handleSubmit}>
                        <EmployeeAndFinancialYearSelector
                            getIncomeDeclaration={getIncomeDeclaration}
                            values={values}
                        />
                        {isLoading ? (
                            <Flex justify="center" align="center">
                                <Spin size="default" />
                            </Flex>
                        ) : (
                            <>
                                <HRASection />
                                <LTASection />
                                <HomeLoanSection />
                                <ChapterVIADeductionsSection values={values} />
                                <HomeLoanDeductionsSection values={values} />
                                <IncomeDeclarationSection />
                                <SummaryAndActionsSection
                                    totalDeductionClaimed="₹400,000"
                                    remainingTaxableIncome="₹400,000"
                                    onSubmit={handleSubmit}
                                    onCancel={() => resetForm({ values: defaultValues })}
                                    loading={buttonLoader}
                                />
                            </>
                        )}
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default IncomeDeclarationTab;
