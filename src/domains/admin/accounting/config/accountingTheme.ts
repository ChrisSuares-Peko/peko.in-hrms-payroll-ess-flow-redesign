import { ThemeConfig } from 'antd';

export const accountingTheme: ThemeConfig = {
    token: {
        colorLink: '#FF3A3A',
        colorLinkHover: '#FF4F4F',
        colorLinkActive: '#EA3639',
    },
    components: {
        Menu: {
            itemSelectedBg: '#FFF2F2',
            itemSelectedColor: '#FF4F4F',
            itemHoverBg: '#F8FAFC',
            itemColor: '#535862',
            itemBorderRadius: 8,
        },
        Layout: {
            siderBg: '#FFFFFF',
            headerBg: '#FFFFFF',
        },
        Alert: {
            colorInfo: '#667085',
            colorInfoBg: '#F8FAFC',
            colorInfoBorder: '#E4E7EC',
        },
    },
};
