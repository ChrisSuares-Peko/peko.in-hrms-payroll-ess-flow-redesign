// PROTOTYPE-SETUP: floating Dummy / Empty data switch, bottom-right, mounted once in App.tsx.
import { Flex, Segmented, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { DataMode, setDataMode } from '@src/slices/dataModeSlice';

const OPTIONS: { label: string; value: DataMode }[] = [
    { label: 'Dummy', value: 'dummy' },
    { label: 'Empty', value: 'empty' },
];

const DataModeToggle = () => {
    const dispatch = useAppDispatch();
    const mode = useAppSelector(state => state.reducer.dataMode?.mode ?? 'dummy');

    return (
        <Flex
            align="center"
            gap={8}
            data-testid="data-mode-toggle"
            className="fixed bottom-4 right-4 z-[999] rounded-xl border border-solid border-gray-200 bg-white px-3 py-2 shadow-lg"
        >
            <Typography.Text type="secondary" className="text-xs">
                Data
            </Typography.Text>
            <Segmented
                size="small"
                options={OPTIONS}
                value={mode}
                onChange={value => dispatch(setDataMode(value as DataMode))}
            />
        </Flex>
    );
};

export default DataModeToggle;
