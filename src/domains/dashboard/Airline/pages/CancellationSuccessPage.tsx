import type { FC } from 'react';

import { Button, Flex } from 'antd';
import { useNavigate } from 'react-router-dom';

import SuccessScreen from '@components/molecular/success/SuccessScreen';
import { paths } from '@src/routes/paths';

interface SuccessPageProps {}

const SuccessPage: FC<SuccessPageProps> = () => {
    const navigate = useNavigate();
    return (
        <SuccessScreen
            title="Your cancellation request has been received"
            message="You have successfully cancelled your booking. Refund Amount will be processed within 7-10 business days."
            // firstButtonTxt="Go Back"
            // firstBtnLink={`${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.manage}/${paths.airline.bookingDetails}`}
        >
            <Flex gap={6} justify="center">
                <Button
                    type="default"
                    style={{ borderColor: '#FF4D4F', color: '#FF4D4F' }}
                    onClick={() =>
                        navigate(
                            `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.manage}/${paths.airline.bookingDetails}`,
                            { state: { refresh: true } }
                        )
                    }
                >
                    Go Back
                </Button>
            </Flex>
        </SuccessScreen>
    );
};

export default SuccessPage;
