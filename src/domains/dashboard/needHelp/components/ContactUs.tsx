import { Col, Flex, Image, Row, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';

import { mail, phone, whatsapp } from '../assets';
import tour from '../assets/tour.svg';
import useEnableProductTour from '../hooks/useEnableProductTour';
import { contactUsData } from '../utils/data';

const { Text, Paragraph } = Typography;

const ContactUs = () => {
    const { handleUpdateTour } = useEnableProductTour();
    const { md, xs } = useScreenSize();
    return (
        <Row
            className="h-full rounded-md sm:mt-8 sm:bg-contactUsBg lg:px-10"
            justify="center"
            align="middle"
        >
            <Col className="pt-2 sm:p-10" xs={24} lg={16}>
                <Space direction="vertical" className="lg:mt-10">
                    <Text className="text-xl sm:font-semibold sm:text-2xl ">👋 Help Center</Text>
                    <Paragraph className="mt-2 max-w-[30rem] ps-1">
                        <Text type="danger">We are glad to have you here!&nbsp;</Text>
                        Our dedicated support team is diligently working to assist you. Your
                        feedback is valuable to us as it drives us forward. For further assistance
                        or any queries, please don&rsquo;t hesitate to get in touch with us.
                    </Paragraph>
                </Space>
                <Flex className="grid grid-cols-3 gap-3 mt-6 mb-5 sm:my-14">
                    <a href="tel:02248930373" style={{ color: 'inherit', textDecoration: 'none' }}>
                        <Flex
                            vertical
                            align="center"
                            justify="center"
                            className="w-full h-full py-2 transition duration-150 transform border rounded-lg sm:border-none hover:scale-105"
                        >
                            <Image src={phone} preview={false} width={xs ? 25 : 50} />
                            <Text className="mt-2 text-[10px] sm:text-base">Call Us at</Text>
                            <Text className="text-[10px] sm:text-lg sm:font-medium">
                                022 489 30373
                            </Text>
                        </Flex>
                    </a>
                    <a
                        target="_blank"
                        rel="noreferrer"
                        href="mailto:reach@peko.one"
                        style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                        <Flex
                            vertical
                            align="center"
                            justify="center"
                            className="w-full h-full py-2 transition duration-150 transform border rounded-lg sm:border-none hover:scale-105"
                        >
                            <Image src={mail} preview={false} width={xs ? 25 : 50} />
                            <Text className="mt-2 text-[10px] sm:text-base">Write to us on </Text>
                            <Text className="text-[10px] sm:text-lg sm:font-medium">
                                reach@peko.one
                            </Text>
                        </Flex>
                    </a>
                    <a
                        href="https://wa.me/+918899010222"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                        <Flex
                            vertical
                            align="center"
                            justify="center"
                            className="w-full h-full py-2 transition duration-150 transform border rounded-lg sm:border-none hover:scale-105"
                        >
                            <Image src={whatsapp} preview={false} width={xs ? 25 : 50} />
                            <Text className="mt-2 text-[10px] sm:text-base">Chat with us on</Text>
                            <Text className="text-[10px] sm:text-lg sm:font-medium">WhatsApp</Text>
                        </Flex>
                    </a>
                </Flex>
            </Col>
            <Col xs={24} lg={8} className="sm:pl-8">
                {md && (
                    <Flex
                        className="py-5 cursor-pointer"
                        gap={8}
                        onClick={handleUpdateTour}
                        justify="start"
                        align="center"
                    >
                        <Image src={tour} preview={false} />
                        <Text className="text-base font-medium text-brandColor">
                            Give me a product tour
                        </Text>
                    </Flex>
                )}
                <Flex
                    vertical
                    gap={24}
                    className="mb-6 rounded-md border border-solid border-black/5 p-6"
                >
                    <Text className="text-lg font-semibold text-lightRed">FAQ</Text>
                    <Flex vertical gap={16}>
                        {contactUsData.map(item => (
                            <Link
                                key={item.text}
                                to={`${item.link}?faqCategory=${encodeURIComponent(item.text)}`}
                                className="text-[15px] leading-[22px] tracking-[0.25px] text-lightRed no-underline hover:text-lightRed hover:underline"
                            >
                                {item.text}
                            </Link>
                        ))}
                    </Flex>
                </Flex>
            </Col>
        </Row>
    );
};

export default ContactUs;
