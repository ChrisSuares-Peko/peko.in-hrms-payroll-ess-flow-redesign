import { Button, Flex, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';

const Header = () => (
    <Flex justify="space-between" align="center" className="mt-3 md:mt-0">
        <Flex>
            <Typography.Text className="font-medium text-lg sm:text-xl">Softwares</Typography.Text>
        </Flex>

        <Flex>
            <Flex gap={5} className=" justify-end md:mt-0 xs:mt-3">
                <Link to={paths.softwares.orderHistory}>
                    <Button type="default" danger className="md:px-5 text-xs md:text-sm">
                        Order History
                    </Button>
                </Link>
            </Flex>
        </Flex>
    </Flex>
);

export default Header;
