import { Flex, Rate, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import HotelImageGallery from '../../HotelImageGallery';

interface basicDetails {
    name: string;
    description: string;
    startRate: string;

    location: string;
    facilities: any;
    images: any[];
}
interface detailsProps {
    details: basicDetails | undefined;
    price?: number | string;
    reviews: any;
}
const HotelviewSm = ({ details, price, reviews }: detailsProps) => (
        <Content className="w-full mt-4 bg-bgLightGray">
            <Content className="p-3">
                <HotelImageGallery images={details?.images} height={220} />
                <Flex justify="space-between">
                    <Flex vertical>
                        <Typography.Text className="text-xs font-medium text-gray-400">
                            Entire home in {details?.name}
                        </Typography.Text>
                        <Typography.Text className="font-bold text-gray-500">
                            {details?.name}
                        </Typography.Text>
                    </Flex>
                    {/* <Flex vertical className="mt-2">
                        <Typography.Text
                            className="font-bold mt-1 text-gray-400"
                            style={{ fontSize: '0.57rem' }}
                        >
                            Price/night
                        </Typography.Text>
                        <Typography.Text className="font-bold">₹ {price}</Typography.Text>
                    </Flex> */}
                </Flex>
                <Flex className="pt-3" justify="space-between">
                    <Flex gap="small">
                        <Rate disabled value={reviews} className="text-sm" />
                    </Flex>
                </Flex>
            </Content>
        </Content>
    );

export default HotelviewSm;
