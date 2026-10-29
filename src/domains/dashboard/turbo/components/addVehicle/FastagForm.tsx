import { Button, Flex, Input, Select, Typography } from 'antd';

const FastagForm = ({
    registration,
    setRegistration,
    registrationReadOnly,
    billerId,
    setBillerId,
    serviceProviderData,
    providersLoading,
    handleServiceProviderSearch,
    resetSearchIfDirty,
    loadMoreServiceProviders,
    submitting,
    fetching,
    onSubmit,
    showSubmit = true,
}: any) => (
    <Flex align="end" gap={24} wrap="wrap" className="mt-4">
        <Flex vertical gap={6} className="w-[320px] max-w-full">
            <Typography.Text>Vehicle Registration Number</Typography.Text>
            <Input
                size="large"
                placeholder="Enter Vehicle Registration Number"
                value={registration}
                disabled={registrationReadOnly}
                onChange={e => setRegistration(e.target.value.toUpperCase())}
            />
        </Flex>
        <Flex vertical gap={6} className="w-[320px] max-w-full">
            <Typography.Text>Service Provider</Typography.Text>
            <Select
                size="large"
                className="w-full"
                showSearch
                placeholder="Select Service Provider"
                value={billerId}
                options={serviceProviderData}
                loading={providersLoading}
                filterOption={false}
                onSearch={handleServiceProviderSearch}
                onOpenChange={open => open && resetSearchIfDirty()}
                onPopupScroll={e => {
                    const t = e.target as HTMLElement;
                    if (t.scrollTop + t.offsetHeight >= t.scrollHeight - 20) {
                        loadMoreServiceProviders();
                    }
                }}
                onChange={value => setBillerId(value)}
            />
        </Flex>
        {showSubmit && (
            <Button
                type="primary"
                danger
                size="large"
                className="min-w-[150px]"
                loading={submitting || fetching}
                onClick={onSubmit}
            >
                Submit
            </Button>
        )}
    </Flex>
);

export default FastagForm;
