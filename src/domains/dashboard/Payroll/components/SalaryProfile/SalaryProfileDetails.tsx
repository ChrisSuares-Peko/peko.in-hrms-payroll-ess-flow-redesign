import { Flex, Skeleton, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

type Props = {
    title: string;
    icon: string;
    subtitle: string;
    loading: any;
};

export const SalaryProfileDetails = ({ title, icon, subtitle, loading }: Props) => (
    <Flex className="mt-5">
        {loading ? (
            <Skeleton />
        ) : (
            <Flex className="ms-4">
                <Flex
                    align="center"
                    justify="center"
                    className="bg-iconBgRed w-12 h-12 rounded-md mt-[.3rem]"
                >
                    <ReactSVG
                        src={icon}
                        beforeInjection={svg => {
                            svg.setAttribute('style', 'width: 19px; height: 19px;');
                        }}
                    />
                </Flex>
                <Flex className="ms-4" vertical>
                    <Typography.Text className=" m-0 text-salaryText font-medium  mt-2">
                        {title}
                    </Typography.Text>
                    <Typography.Text
                        className="text-salarySubText text-sm"
                        style={{ fontSize: ' 0.92rem' }}
                    >
                        {subtitle}
                    </Typography.Text>
                </Flex>
            </Flex>
        )}
    </Flex>
);
