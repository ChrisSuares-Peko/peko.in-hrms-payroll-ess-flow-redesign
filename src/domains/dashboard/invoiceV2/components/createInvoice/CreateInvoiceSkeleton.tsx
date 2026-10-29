import { Flex, Skeleton } from 'antd';

const CreateInvoiceSkeleton = () => (
    <Flex className="w-full bg-[#fafafa] rounded-2xl sm:rounded-3xl p-3 sm:p-6 lg:p-10">
        <Flex
            vertical
            gap={30}
            className="w-full bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-14 shadow-md"
        >
            <Flex vertical align="center" gap={16}>
                <Skeleton.Input active className="!w-[220px] !max-w-full !h-10" />
                <Skeleton.Button active className="!w-full !max-w-[400px] !h-11 !rounded-full" />
            </Flex>

            <Flex gap={24} className="flex-col xl:flex-row">
                <Flex vertical gap={14} className="w-full">
                    <Skeleton.Input active className="!w-[180px] !max-w-full" />
                    <Skeleton active paragraph={{ rows: 7 }} title={false} />
                </Flex>
                <Flex vertical gap={14} className="w-full">
                    <Skeleton.Input active className="!w-[180px] !max-w-full" />
                    <Skeleton active paragraph={{ rows: 6 }} title={false} />
                </Flex>
            </Flex>

            <Skeleton active paragraph={{ rows: 6 }} title={{ width: 220 }} />

            <Flex gap={24} className="flex-col xl:flex-row">
                <Flex vertical gap={14} className="w-full">
                    <Skeleton.Input active className="!w-[220px] !max-w-full" />
                    <Skeleton active paragraph={{ rows: 4 }} title={false} />
                </Flex>
                <Flex vertical gap={14} className="w-full xl:max-w-[360px]">
                    <Skeleton.Input active className="!w-[180px] !max-w-full" />
                    <Skeleton active paragraph={{ rows: 5 }} title={false} />
                </Flex>
            </Flex>

            <Flex justify="flex-end" gap={12} wrap>
                <Skeleton.Button active className="!w-full sm:!w-[120px] !h-10" />
                <Skeleton.Button active className="!w-full sm:!w-[160px] !h-10" />
            </Flex>
        </Flex>
    </Flex>
);

export default CreateInvoiceSkeleton;
