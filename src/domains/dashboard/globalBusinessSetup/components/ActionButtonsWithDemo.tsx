import { useRef } from 'react';

import { Button, Flex, Typography } from 'antd';
import { PopupButton } from 'react-calendly';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import callIcon from '@domains/dashboard/Invoice/assets/details.svg';
import { CALENDLY_URL } from '@src/config-global';
import { paths } from '@src/routes/paths';

const ActionButtonsWithDemo = () => {
    const navigate = useNavigate();
    const rootRef = useRef<HTMLDivElement | null>(null);

    return (
        <Flex vertical>
            <Flex gap={15} justify="center" className="w-full">
                <Button
                    key="submit"
                    type="primary"
                    danger
                    className="h-10 md:px-6"
                    size="large"
                    onClick={() => navigate(`${paths.globalBusinessSetup.getStarted}`)}
                >
                    Start Now
                </Button>

                <Button
                    key="back"
                    className="h-10 md:px-10"
                    size="large"
                    danger
                    onClick={() => navigate(`${paths.globalBusinessSetup.applications}`)}
                >
                    Applications
                </Button>
            </Flex>

            <Flex ref={rootRef} className="justify-center mt-5" gap={5}>
                <ReactSVG src={callIcon} />

                <Typography.Text className="text-lightRed xs:text-xs md:text-sm">
                    <PopupButton
                        url={CALENDLY_URL}
                        rootElement={rootRef.current || document.body}
                        text="Request for Demo"
                        className="text-lightRed xs:text-xs md:text-sm"
                    />
                </Typography.Text>
            </Flex>
        </Flex>
    );
};
export default ActionButtonsWithDemo;
