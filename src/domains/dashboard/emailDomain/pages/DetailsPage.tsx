import React, { useCallback, useState } from 'react';

import { Skeleton } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import Plans from '../components/Plans';
import useEmailDomainPlansApi from '../hooks/useEmailDomainPlansApi';
import useForm from '../hooks/useForm';
import { productComponents } from '../utils/products';

const DetailsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedProductId } = useAppSelector(state => state.reducer.businessEmail);
    const activeId = location?.state?.productId || selectedProductId;
    // Redirect to another page if activeId is not available
    if (!activeId) {
        navigate(paths.dashboard.emailDomain, { replace: true });
    }
    const [selectedType, setSelectedType] = useState('Monthly');
    const { plansData, productData, isLoading } = useEmailDomainPlansApi(activeId);
    const [formData, setFormData] = useState<any>({});
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);
    const { handleSubmission } = useForm();

    const handleChange = useCallback(
        (tab: string) => {
            setSelectedType(tab);
        },
        [setSelectedType]
    );

    const handlePurchase = useCallback(
        ({ amount, planId, planName }: { amount: string; planId: number; planName: string }) => {
            handleSubmission({ amount, formData, planId, selectedType, planName });
        },
        [formData, handleSubmission, selectedType] // dependencies to track changes
    );

    return (
        <>
            {isLoading ? (
                <Skeleton active />
            ) : (
                <>
                    {productData?.peko_key &&
                    productComponents[productData.peko_key as keyof typeof productComponents]
                        ? React.createElement(
                              productComponents[
                                  productData.peko_key as keyof typeof productComponents
                              ],
                              {
                                  setFormData,
                                  formData,
                                  setIsFormSubmitted,
                                  productData,
                              }
                          )
                        : React.createElement(productComponents.default, {
                              setFormData,
                              formData,
                              setIsFormSubmitted,
                              productData,
                          })}
                </>
            )}
            {isFormSubmitted && (
                <Plans
                    isLoading={isLoading}
                    plansData={plansData}
                    selectedType={selectedType}
                    handleChange={handleChange}
                    isFormSubmitted={isFormSubmitted}
                    handlePurchase={handlePurchase}
                />
            )}
        </>
    );
};

export default DetailsPage;
