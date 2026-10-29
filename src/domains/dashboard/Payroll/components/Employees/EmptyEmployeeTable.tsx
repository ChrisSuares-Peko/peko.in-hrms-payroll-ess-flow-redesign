import { Flex, Image, Row, Typography } from 'antd';

import { EmptyAllEmployeeImg } from '../../assets/images/export';

type Props = {};

const EmptyEmployeeTable = (props: Props) => (
    <Row>
        <Flex className="w-full h-96 my-10" justify="center" align="center" gap="middle" vertical>
            <Image preview={false} src={EmptyAllEmployeeImg} width={300} />
            <Typography.Text className="text-center text-titleText text-2xl font-light">
                No Employee Found
            </Typography.Text>
        </Flex>
    </Row>
);

export default EmptyEmployeeTable;
