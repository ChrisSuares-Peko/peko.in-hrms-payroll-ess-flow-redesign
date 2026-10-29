import { Flex, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

type Props = {
    text?: string;
};

function TermsAndConditionTab({ text }: Props) {
    return (
        <Content>
            <Flex>
                <Typography.Paragraph className=" text-neutral-500 text-xs font-normal leading-loose tracking-wider">
                    {text}
                </Typography.Paragraph>
            </Flex>
        </Content>
    );
}

export default TermsAndConditionTab;
