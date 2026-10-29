import type { FC } from 'react';

import { Button, Flex, Result } from 'antd';
import Lottie from 'react-lottie';
import { Link } from 'react-router-dom';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

interface SuccessPageProps {}

const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: paymentSuccess,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
    },
};

const SuccessPage: FC<SuccessPageProps> = () => {
    const { md } = useScreenSize();
    const iconSize = md ? 150 : 90;

    return (
        <Flex vertical justify="center" align="center" gap={30}>
            <Result
                className="md:w-4/6 p-0"
                icon={<Lottie options={defaultOptions} height={iconSize} width={iconSize} />}
                status="success"
                title="Your document has been successfully sent to the signer(s)."
                subTitle={
                    <>
                        <div>
                            You can check the status of the eSign by clicking on the button below
                            or
                        </div>
                        <div> Go Back to initiate another eSign.</div>
                    </>
                }
                extra={[
                    <Link to={`${paths.dashboard.eSign}/${paths.eSign.historyPage}`} key="backBtn">
                        <Button type="primary" className="bg-brandColor">
                            Check e-Sign Status
                        </Button>
                    </Link>,

                    <Link to={paths.dashboard.eSign} key="downloadBtn">
                        <Button>Go Back </Button>
                    </Link>,
                ]}
            />
        </Flex>
    );
};

export default SuccessPage;
