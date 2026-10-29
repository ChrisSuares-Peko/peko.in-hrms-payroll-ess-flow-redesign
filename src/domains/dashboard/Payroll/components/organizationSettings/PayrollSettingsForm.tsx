import React from 'react';

import { Button, Flex, Form, Skeleton } from 'antd';
import { Formik } from 'formik';

import useGeneralApi from '@src/domains/dashboard/profile/hooks/useGeneralApi';
import { useAppSelector } from '@src/hooks/store';

import CompanyDetailsForm from './companyDetails/CompanyDetailsForm';
import { useProgressApi } from '../../hooks/dashboardHooks/useProgressApi';
import useCorporateDetailsApi from '../../hooks/OrganizationSettings/useGetCorporateDetailsApi';
import useGetOrganizationSetting from '../../hooks/OrganizationSettings/useGetOrganizationDetailsApi';
import useOrganizationSettingsApi from '../../hooks/OrganizationSettings/useOrganizationSettingsApi';
import { CompayDetailsSchema } from '../../schema/organizationSettings';

type Props = {
    setActiveTabKey: any;
};

const PayrollSettingsForm: React.FC<Props> = ({ setActiveTabKey }) => {
    const { updateCompanyProfile } = useOrganizationSettingsApi();
    useProgressApi();
    const { statesList } = useGeneralApi();
    const { tableData, loader } = useCorporateDetailsApi();
    useGetOrganizationSetting();
    const { companyProfile, organizationTaxDetails, isLoading } = useAppSelector(
        state => state.reducer.orgSettings
    );
    return isLoading || loader ? (
        <Skeleton />
    ) : (
        <Flex vertical gap={20} className="pt-1">
            <Formik
                initialValues={{
                    companyName: companyProfile?.companyName || tableData?.companyName || '',
                    companyAddressLine1: companyProfile?.companyAddressLine1 || '',
                    companyAddressLine2: companyProfile?.companyAddressLine2 || '',
                    city: companyProfile?.city || '',
                    pinCode: companyProfile?.pinCode || '',
                    state: companyProfile?.state || tableData?.userState || '',
                    contactNumber: companyProfile?.contactNumber || tableData?.mobileNo || '',
                    emailAddress: companyProfile?.emailAddress || tableData?.userEmail || '',
                    companyLogo: companyProfile?.companyLogo || '',
                    industry: companyProfile?.industry || '',
                    PAN: organizationTaxDetails?.PAN || '',
                    TAN: organizationTaxDetails?.TAN || '',
                    TDSCode: organizationTaxDetails?.TDSCode || '',
                    taxPaymentFrequency: organizationTaxDetails?.taxPaymentFrequency || '',
                }}
                enableReinitialize
                validationSchema={CompayDetailsSchema}
                onSubmit={async (values, { resetForm }) => {
                    await updateCompanyProfile(values);
                    setActiveTabKey('2');
                }}
            >
                {({ handleSubmit, isSubmitting, setFieldValue }) => (
                    <Form layout="vertical" onFinish={handleSubmit}>
                        <CompanyDetailsForm
                            companyProfileData={companyProfile}
                            statesList={statesList}
                        />
                        <Flex gap={10} className="mt-4">
                            <Button
                                className="px-12"
                                type="primary"
                                danger
                                htmlType="submit"
                                loading={isSubmitting}
                            >
                                Save
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default PayrollSettingsForm;
