import React from 'react';

import { Button, Flex, Form, Skeleton, Spin, Typography } from 'antd';
import { Formik } from 'formik';
import { ReactSVG } from 'react-svg';

import skipDashboardIcon from '@domains/dashboard/Payroll/assets/icons/skipDashboardIcon.svg';
import useGeneralApi from '@domains/dashboard/profile/hooks/useGeneralApi';
import { useAppDispatch } from '@src/hooks/store';

import useGetCompanyProfile from '../../hooks/OrganizationSettings/useGetCompanyProfile';
import useCorporateDetailsApi from '../../hooks/OrganizationSettings/useGetCorporateDetailsApi';
import useGetOrganizationSetting from '../../hooks/OrganizationSettings/useGetOrganizationDetailsApi';
import useOrganizationSettingsApi from '../../hooks/OrganizationSettings/useOrganizationSettingsApi';
import { CompayDetailsSchema } from '../../schema/organizationSettings';
import { setPayrollProgress } from '../../slices/payrollAuth';
import CompanyDetailsForm from '../organizationSettings/companyDetails/CompanyDetailsForm';

type Props = {
    setActiveTabKey: any;
    setRefresh: any;
};

const WelcomeCompanyDetailsForm: React.FC<Props> = ({ setActiveTabKey, setRefresh }) => {
    const dispatch = useAppDispatch();
    const {
        updateCompanyProfile,
        updateSkipDashboard,
        isLoading: skipDashboardLoader,
    } = useOrganizationSettingsApi();
    const isWelcomePage = true;
    const { tableData, loader } = useCorporateDetailsApi();
    const { statesList } = useGeneralApi();
    useGetOrganizationSetting();
    const { companyProfileData, isLoading } = useGetCompanyProfile();

    const handleSkipDashboard = async () => {
        await updateSkipDashboard(true);
        dispatch(setPayrollProgress({ isSkippedDasboard: true }));
    };

    if (isLoading || loader) {
        return <Skeleton />;
    }

    return (
        <Spin spinning={skipDashboardLoader}>
            <Flex vertical gap={20} className="relative">
                <Formik
                    initialValues={{
                        companyName:
                            companyProfileData?.companyProfile?.companyName ||
                            tableData?.companyName ||
                            '',
                        companyAddressLine1:
                            companyProfileData?.companyProfile?.companyAddressLine1 || '',
                        companyAddressLine2:
                            companyProfileData?.companyProfile?.companyAddressLine2 || '',
                        city: companyProfileData?.companyProfile?.city || '',
                        pinCode: companyProfileData?.companyProfile?.pinCode || '',
                        state:
                            companyProfileData?.companyProfile?.state || tableData?.userState || '',
                        contactNumber:
                            companyProfileData?.companyProfile?.contactNumber ||
                            tableData?.mobileNo ||
                            '',
                        emailAddress:
                            companyProfileData?.companyProfile?.emailAddress ||
                            tableData?.userEmail ||
                            '',
                        companyLogo: companyProfileData?.companyProfile?.companyLogo || '',
                        industry: companyProfileData?.companyProfile?.industry || '',
                        PAN: companyProfileData?.organizationTaxDetails?.PAN || '',
                        TAN: companyProfileData?.organizationTaxDetails?.TAN || '',
                        TDSCode: companyProfileData?.organizationTaxDetails?.TDSCode || '',
                        taxPaymentFrequency:
                            companyProfileData?.organizationTaxDetails?.taxPaymentFrequency || '',
                    }}
                    enableReinitialize
                    validationSchema={CompayDetailsSchema}
                    onSubmit={async (values, { resetForm }) => {
                        await updateCompanyProfile(values);
                        setActiveTabKey('1');
                    }}
                >
                    {({ handleSubmit, isSubmitting }) => (
                        <Form layout="vertical" onFinish={handleSubmit}>
                            <CompanyDetailsForm
                                companyProfileData={companyProfileData}
                                statesList={statesList}
                                isWelcomePage={isWelcomePage}
                            />

                            <Flex
                                align="center"
                                justify="space-between"
                                className="xs:mt-2 md:mt-4 w-full"
                            >
                                <Flex
                                    align="center"
                                    onClick={handleSkipDashboard}
                                    className="cursor-pointer mx-auto"
                                    gap={8}
                                >
                                    <Typography.Text className="text-textRed text-center">
                                        I’ll do this later. Take me to the Payroll Dashboard
                                    </Typography.Text>
                                    <ReactSVG src={skipDashboardIcon} />
                                </Flex>
                                <Button
                                    className="px-12"
                                    type="primary"
                                    danger
                                    htmlType="submit"
                                    loading={isSubmitting}
                                >
                                    Next
                                </Button>
                            </Flex>
                        </Form>
                    )}

                </Formik>
            </Flex>
        </Spin>
    );
};

export default WelcomeCompanyDetailsForm;
