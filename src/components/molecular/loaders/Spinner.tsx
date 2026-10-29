import type { FC } from 'react';

import { Spin, Flex } from 'antd';

import { useAppSelector } from '@src/hooks/store';

interface SpinnerProps {
    size?: 'large' | 'small' | 'default';
}

const Spinner: FC<SpinnerProps> = ({ size = 'default' }) => {
    const { isLoading } = useAppSelector(state => state.reducer.loader);
    return (
        isLoading && (
            <Flex className="fixed w-full h-full items-center justify-center bg-white bg-opacity-70 z-50">
                <Flex
                    vertical
                    style={{
                        position: 'fixed',
                        top: '50vh',
                        left: '50vw',
                        transform: 'translate(-50%, -50%)',
                        background: 'transparent',
                        border: 'none',
                        height: 'fit-content',
                        width: 'fit-content',
                        zIndex: 1000, // On top of the overlay
                    }}
                >
                    <Flex className=" justify-content-center">
                        <Spin size={size} tip="Loading..." />
                    </Flex>
                </Flex>
            </Flex>
        )
    );
};
export default Spinner;
