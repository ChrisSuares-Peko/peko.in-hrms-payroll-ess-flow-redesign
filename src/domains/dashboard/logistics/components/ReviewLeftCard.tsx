import { Flex, Typography, Col, Row } from 'antd';
import { ReactSVG } from 'react-svg';

import TruckSvg from '@domains/dashboard/logistics/assets/images/truck.svg';
import { useAppSelector } from '@src/hooks/store';

import { GrayTextLeft } from './CustomText';
import { formalTextFormatter } from '../utils/helperFunctions';

type Props = {};

const { Text } = Typography;

const ReviewLeftCard = (props: Props) => {
    const { originAddress, destinationAddress, shipmentDetails } = useAppSelector(
        state => state.reducer.logistics
    );

    return (
        <Flex
            vertical
            justify="space-around"
            className="h-full px-6 py-5 border rounded-md sm:rounded-xl border-stone-300 sm:px-12"
        >
            <Flex vertical>
                <ReactSVG className="mb-3 more-services" src={TruckSvg} />
            </Flex>
            <Flex vertical>
                <Text className="pb-2 text-sm font-medium">Sender details</Text>
                <GrayTextLeft text={originAddress.Line1} />
                <GrayTextLeft
                    text={`${originAddress.Line2.trim()}, ${formalTextFormatter(originAddress.City)}`}
                />
            </Flex>

            <Flex vertical>
                <Text className="pb-2 text-sm font-medium ">Receiver details</Text>
                <GrayTextLeft text={destinationAddress.Line1} />
                <GrayTextLeft
                    text={`${destinationAddress.Line2.trim()}, ${formalTextFormatter(destinationAddress.City)}`}
                />
            </Flex>
            <Row gutter={80}>
                <Col xs={24} sm={12}>
                    <Flex vertical>
                        <Text className="pb-2 text-sm font-medium ">Order Category</Text>
                        <GrayTextLeft text={shipmentDetails.orderCategory} />
                    </Flex>
                </Col>
                <Col xs={24} sm={12}>
                    <Flex vertical>
                        <Text className="pb-2 text-sm font-medium ">Package Weight</Text>
                        <GrayTextLeft text={`${shipmentDetails.packageWeight.toString()} Grams`} />
                    </Flex>
                </Col>
            </Row>
            <Row gutter={80}>
                <Col xs={24} sm={12}>
                    <Flex vertical>
                        <Text className="pb-2 text-sm font-medium ">Service Type</Text>
                        <GrayTextLeft text={formalTextFormatter(shipmentDetails.serviceType)} />
                    </Flex>
                </Col>
                <Col xs={24} sm={12}>
                    <Flex vertical>
                        <Text className="pb-2 text-sm font-medium ">Pickup Date</Text>
                        <GrayTextLeft text={shipmentDetails.orderDate.split(' ')[0]} />
                    </Flex>
                </Col>
            </Row>
        </Flex>
    );
};

export default ReviewLeftCard;
