import { useMemo } from 'react';

import { Form, Skeleton } from 'antd';

import SearchSelectInput from '@src/domains/dashboard/billPayments/components/CustomSelectSearch';

import { OptionsType } from '../../types/index';

interface ServiceProviderSelectProps {
    options: OptionsType[];
    savedBillerId?: string | null;
    savedProviderName?: string;
    isLoading: boolean;
    hasMore: boolean;
    showSkeleton: boolean;
    onChange: (value: string, labelName: any) => void;
    onSearch: (value: string) => void;
    onLoadMore: () => void;
    onOpen: () => void;
}

const LABEL = 'Select Service Provider';

// BBPS biller picker for the beneficiary form: searchable, paginated on scroll, with a skeleton while
// an edited beneficiary's saved provider is being resolved.
const ServiceProviderSelect = ({
    options,
    savedBillerId,
    savedProviderName,
    isLoading,
    hasMore,
    showSkeleton,
    onChange,
    onSearch,
    onLoadMore,
    onOpen,
}: ServiceProviderSelectProps) => {
    // The saved provider may not be on the currently-loaded biller page (the list is paginated), so
    // the Select would otherwise display the raw billerId. Surface a synthetic option carrying the
    // saved provider name until the real option is loaded.
    const mergedOptions = useMemo(() => {
        if (!savedBillerId || options.some(opt => opt.value === savedBillerId)) return options;
        return [
            { value: savedBillerId, label: savedProviderName || savedBillerId, customerParams: [] },
            ...options,
        ];
    }, [options, savedBillerId, savedProviderName]);

    if (showSkeleton) {
        return (
            <Form.Item label={LABEL} required>
                <Skeleton.Input active block />
            </Form.Item>
        );
    }
    return (
        <SearchSelectInput
            name="billerId"
            label={LABEL}
            options={mergedOptions}
            placeholder={LABEL}
            handleChange={onChange}
            isLoading={isLoading}
            isRequired
            filterOption={false}
            onSearch={onSearch}
            onDropdownVisibleChange={open => {
                if (open) onOpen();
            }}
            onPopupScroll={event => {
                const target = event.target as HTMLDivElement;
                const reachedBottom =
                    target.scrollTop + target.clientHeight >= target.scrollHeight - 20;
                if (reachedBottom && hasMore) onLoadMore();
            }}
        />
    );
};

export default ServiceProviderSelect;
