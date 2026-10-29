import type { RefObject } from 'react';

import { Button, Flex, Typography } from 'antd';

const { Text } = Typography;

interface Props {
    plansRef: RefObject<HTMLDivElement>;
}

const GoogleWorkspaceProductInfo = ({ plansRef }: Props) => (
    <div className="mt-[50px] flex flex-col gap-[50px] rounded-[28px] bg-white px-6 py-8 shadow-[0px_2px_20px_0px_rgba(0,0,0,0.06)] lg:px-[50px] lg:py-[60px]">
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <Typography.Title className="!mb-0 !mt-0 !text-[28px] !font-semibold !leading-[38px] !text-[#1e293b]">
                Product Info
            </Typography.Title>
            <Button
                className="h-[45px] w-[140px] rounded-[10px] text-[15px] font-semibold lg:w-[187px] bg-lightRed border-lightRed text-white"
                onClick={() => plansRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
                Buy now
            </Button>
        </Flex>

        <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-3">
            {[
                { label: 'Product Category', value: 'Email' },
                { label: 'Product Name', value: 'Google Workspace' },
                { label: 'Brand', value: 'ResellerClub' },
            ].map(({ label, value }) => (
                <Flex key={label} vertical gap={10}>
                    <Text className="text-[16px] font-medium leading-[38px] text-[#1e293b] lg:text-[20px]">{label}</Text>
                    <Text className="text-[14px] font-normal leading-[28px] text-[#6f6c8f] lg:text-[20px]">{value}</Text>
                </Flex>
            ))}
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <Flex vertical gap={10}>
                <Text className="text-[16px] font-medium leading-[38px] text-[#1e293b] lg:text-[20px]">Product Description</Text>
                <Text className="text-[14px] font-normal leading-[28px] text-[#6f6c8f] lg:text-[20px]">
                    With Google Workspace, get a set of Google apps for business that let you and your colleagues collaborate efficiently wherever you are in the world. Get a professional email address, additional storage across Gmail and Drive, interoperability with Microsoft Outlook, enhanced security and more.
                </Text>
            </Flex>
            <Flex vertical gap={10}>
                <Text className="text-[16px] font-medium leading-[38px] text-[#1e293b] lg:text-[20px]">Ideal for</Text>
                <ul className="list-disc text-[14px] font-normal leading-[28px] text-[#6f6c8f] lg:text-[20px]">
                    {['Businesses', 'Digital Marketing Agencies', 'Hosting Companies'].map(item => (
                        <li key={item} className="ms-[30px]">{item}</li>
                    ))}
                </ul>
            </Flex>
        </div>
    </div>
);

export default GoogleWorkspaceProductInfo;
