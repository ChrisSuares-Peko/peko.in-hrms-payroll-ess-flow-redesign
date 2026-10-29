/* eslint-disable react/no-danger */
import { Button, Flex, Typography } from 'antd';
import DOMPurify from 'dompurify';

import useScreenSize from '@src/hooks/useScreenSize';

import BannerImage from '../../assets/images/image.webp';
import '../../assets/styles.css';

const AirlineBanner = ({
    data,
    handleButtonClick,
}: {
    data: any;
    handleButtonClick: () => void;
}) => {
    const { Text } = Typography;
    const { sm } = useScreenSize();

    return (
        <div className="font-sf relative min-h-[180px] sm:min-h-[200px] md:min-h-[220px] max-[700px]:min-h-[220px] max-[430px]:min-h-[180px]  overflow-hidden rounded-[24px] p-[20px] sm:px-[28px] sm:py-[24px] md:px-[40px] md:py-[28px] max-[700px]:px-[24px] max-[700px]:py-[22px] max-[430px]:!py-[29px] pr-[190px] sm:pr-[300px] md:pr-[460px] max-[700px]:!pr-[220px] max-[430px]:!pr-[24px] bg-gradient-to-r from-[#F0F7FF] to-[#FFF2F2] box-border mb-3 md:mb-5">
            <div className="absolute top-0 h-full pointer-events-none w-[420px] origin-top-right transform scale-[0.6] -right-[30px] sm:right-0 sm:scale-[0.8] md:scale-100 max-[700px]:!w-[380px] max-[700px]:!scale-[0.7] max-[700px]:!right-[-10px] max-[430px]:!hidden z-0">
                {/* Ellipse 1 */}
                <div className="absolute w-[369px] h-[369px] -top-[160px] left-[65px] rounded-full bg-[#FFEEEE]" />

                {/* Ellipse 2 */}
                <div className="absolute w-[297px] h-[297px] -top-[127px] left-[100px] rounded-full bg-[#FFFFFF91]" />

                {/* Ellipse 3 */}
                <div className="absolute w-[227px] h-[227px] -top-[92px] left-[135px] rounded-full bg-[#FFFEFD]" />

                {/* Flight Image */}
                <img
                    src={BannerImage}
                    alt="Airline banner"
                    className="
                        absolute
                        right-[30px]
                        top-[52%]
                        -translate-y-1/2
                        w-[370px]
                        h-auto
                        object-contain
                        z-10
                        max-[700px]:!right-[12px]
                        max-[700px]:!w-[320px]
                    "
                />
            </div>

            {/* ================= CONTENT ================= */}
            <Flex
                vertical
                justify="center"
                className="max-[430px]:!justify-start"
                style={{
                    height: '100%',
                    maxWidth: sm ? 520 : '100%',
                    position: 'relative',
                    zIndex: 2,
                }}
                gap={sm ? 14 : 10}
            >
                <Text
                    className="whitespace-nowrap max-[700px]:!text-[20px]  max-[520px]:!text-[16px] max-[430px]:!text-[20px]"
                    style={{
                        fontSize: sm ? 24 : 18,
                        fontWeight: 500,
                        color: '#111827',
                    }}
                >
                    {data?.[0]?.bannerTitle || 'Save 25% on air tickets'}
                </Text>

                <div
                    className="max-[740px]:!text-[12px] max-[520px]:!text-[11px] max-[430px]:!text-[12px] -mt-[2px]"
                    style={{
                        fontSize: sm ? 15 : 12,
                        lineHeight: '1.5rem',
                        color: '#000000',
                    }}
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(data?.[0]?.description || ''),
                    }}
                />

                <Button
                    onClick={handleButtonClick}
                    danger
                    type="primary"
                    size={sm ? 'middle' : 'small'}
                    className="max-[576px]:!rounded-[6px]"
                    style={{
                        width: sm ? 120 : 100,
                        fontWeight: sm ? 500 : 400,
                    }}
                >
                    {data?.[0]?.buttonText || 'Book Now'}
                </Button>
            </Flex>
        </div>
    );
};

export default AirlineBanner;
