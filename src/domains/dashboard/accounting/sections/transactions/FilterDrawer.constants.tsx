import { Typography } from 'antd';

const { Text } = Typography;

export const SectionLabel = ({ children }: { children: string }) => (
    <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">{children}</Text>
);

export const CHIP =
    '!m-0 !inline-flex !items-center whitespace-nowrap rounded-lg border border-borderSubtle bg-surfaceGray px-3 py-2 text-sm text-bodyText';

export const CHIP_ACTIVE = '!border-brandColor !bg-red-50 !text-brandColor';
export const FIELD = '!rounded-lg !border-borderSubtle !bg-surfaceGray';

export const chip = (active: boolean) => `${CHIP} ${active ? CHIP_ACTIVE : ''}`.trim();
