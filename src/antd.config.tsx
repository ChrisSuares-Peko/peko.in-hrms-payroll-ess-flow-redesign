import { ConfigProvider, theme } from 'antd';

function AntdConfig({ children }: any) {
    const { defaultAlgorithm } = theme;

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: ' #FF3A3A',
                    colorText: '#121212',
                    controlHeight: 36,
                    controlHeightLG: 40,
                    paddingLG: 40,
                    borderRadiusSM: 2,
                    borderRadiusLG: 4,
                    borderRadius: 2,
                },
                algorithm: defaultAlgorithm,
                components: {
                    Menu: {
                        // itemSelectedBg: 'transparent',
                        activeBarBorderWidth: 0,
                        // itemHoverBg: 'transparent',
                        itemColor: '#7b7b7b',
                    },
                    Typography: {
                        titleMarginBottom: 0,
                        titleMarginTop: 0,
                        fontFamily: 'Roboto',
                    },
                    Card: {
                        paddingLG: 25,
                    },
                    Divider: {
                        marginLG: 10,
                    },
                    Carousel: {
                        dotActiveWidth: 10,
                        dotWidth: 10,
                        dotHeight: 10,
                        borderRadius: 999,
                    },
                    Button: {
                        borderRadiusSM: 3,
                        borderRadiusLG: 6,
                        borderRadius: 6,
                    },
                    Input: {
                        borderRadiusSM: 2,
                        borderRadiusLG: 6,
                        borderRadius: 6,
                    },
                    Select: {
                        borderRadiusSM: 2,
                        borderRadiusLG: 6,
                        borderRadius: 6,
                    },
                    Checkbox: {
                        borderRadiusSM: 2,
                        borderRadiusLG: 6,
                        borderRadius: 6,
                    },
                    DatePicker: {
                        borderRadiusSM: 2,
                        borderRadiusLG: 6,
                        borderRadius: 6,
                    },
                    InputNumber: {
                        handleVisible: true,
                        borderRadiusSM: 2,
                        borderRadiusLG: 6,
                        borderRadius: 6,
                    },
                    Steps: {
                        colorPrimary: '#26A411',
                        dotSize: 20,
                        lineHeight: 2,
                    },
                    Tour: {
                        colorPrimary: '#162D39',
                    },
                },
            }}
        >
            {children}
        </ConfigProvider>
    );
}

export default AntdConfig;
