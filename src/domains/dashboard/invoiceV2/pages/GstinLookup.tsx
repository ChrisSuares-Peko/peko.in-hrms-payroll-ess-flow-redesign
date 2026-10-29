import React, { useMemo, useRef } from 'react';

import { Button, Flex, Input } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Formik, FormikHelpers, FormikProps } from 'formik';

import TypographyText from '@components/atomic/typography/typographyText';

import GstinDetailsCard from '../components/gstinLookup/GstinDetailsCard';
import GstinDetailsCardSkeleton from '../components/gstinLookup/GstinDetailsCardSkeleton';
import GstinFormatCard from '../components/gstinLookup/GstinFormatCard';
import GstinLookupEmptyState from '../components/gstinLookup/GstinLookupEmptyState';
// import RecentLookupsCard from '../components/gstinLookup/RecentLookupsCard';
import LeftHeader from '../components/shared/LeftHeader';
import useGstinLookup from '../hooks/useGstinLookup';
import { gstinLookupSchema } from '../schema/gstinLookupSchema';
import { GstinLookupFormValues, gstinLookupInitialValues } from '../types/gstinLookup';

const GstinLookup: React.FC = () => {
    const formikRef = useRef<FormikProps<GstinLookupFormValues>>(null);
    const { details, isSearching, search } = useGstinLookup();

    const handleSubmit = async (
        values: GstinLookupFormValues,
        helpers: FormikHelpers<GstinLookupFormValues>
    ) => {
        await search(values.gstin.trim().toUpperCase());
        helpers.setSubmitting(false);
    };

    const initialValues = useMemo(() => ({ ...gstinLookupInitialValues }), []);

    return (
        <Content className="px-0">
            <LeftHeader
                title="GSTIN Lookup"
                titleClass="mt-4 text-xl md:text-2xl"
                description="Verify and fetch GSTIN details from GST portal"
            />

            <Formik
                innerRef={formikRef}
                initialValues={initialValues}
                validationSchema={gstinLookupSchema}
                onSubmit={handleSubmit}
            >
                {({ values, errors, touched, setFieldValue, handleSubmit: submit, handleBlur }) => {
                    const showError = !!(touched.gstin && errors.gstin);
                    return (
                        <Flex
                            vertical
                            className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#EFF6FF] to-[#FFF1F2] p-4 md:p-5 my-5"
                        >
                            <Flex vertical gap={8} className="relative z-10">
                                <Flex
                                    align="center"
                                    gap={10}
                                    className={`bg-white rounded-xl border shadow-sm pl-3 pr-3 py-1.5 ${
                                        showError ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
                                    }`}
                                >
                                    <Input
                                        name="gstin"
                                        value={values.gstin}
                                        onChange={e => {
                                            const sanitized = e.target.value
                                                .toUpperCase()
                                                .replace(/[^0-9A-Z]/g, '')
                                                .slice(0, 15);
                                            setFieldValue('gstin', sanitized);
                                        }}
                                        onBlur={handleBlur}
                                        onPressEnter={() => submit()}
                                        placeholder="Enter GSTIN (e.g. 29AABCU9603R1ZX)"
                                        maxLength={15}
                                        variant="borderless"
                                        className="flex-1 h-10 text-sm placeholder:!text-[#6B7280] !shadow-none"
                                    />
                                    <Button
                                        type="primary"
                                        danger
                                        onClick={() => submit()}
                                        loading={isSearching}
                                        className="h-10 px-10"
                                    >
                                        Search
                                    </Button>
                                </Flex>
                                {showError && (
                                    <TypographyText className="text-[#EF4444] text-xs md:text-sm font-normal">
                                        {errors.gstin}
                                    </TypographyText>
                                )}
                            </Flex>
                        </Flex>
                    );
                }}
            </Formik>

            <Flex gap={20} className="pt-4 flex-col xl:flex-row xl:items-start">
                <Flex className="flex-1 min-w-0">
                    {isSearching && <GstinDetailsCardSkeleton />}
                    {!isSearching && details && <GstinDetailsCard details={details} />}
                    {!isSearching && !details && <GstinLookupEmptyState />}
                </Flex>
                <Flex vertical gap={16} className="w-full xl:w-[340px] xl:flex-shrink-0">
                    {/* <RecentLookupsCard lookups={recentLookups} onSelect={handleSelectRecent} /> */}
                    <GstinFormatCard />
                </Flex>
            </Flex>
        </Content>
    );
};

export default GstinLookup;
