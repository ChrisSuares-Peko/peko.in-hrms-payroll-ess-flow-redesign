import { Row, Col, Flex } from 'antd';

import ActionButtons from '../components/ActionButtons';
// import Information from '../components/Information';

const Dashboard = () => (
    // const { BusinessProfile } = useCreateBusinessProfileApi();
    // const [isLoading, setIsLoading] = useState(true);

    // useEffect(() => {
    //     BusinessProfile();
    //     setIsLoading(false);
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, []); // eslint-disable-next-line

    <Flex>
        {/* {isLoading ? (
                <Skeleton active />
            ) : ( */}
        <Row className="px-0">
            <Col span={24}>
                {/* <Information /> */}

                <ActionButtons />
            </Col>
        </Row>
        {/* )} */}
    </Flex>
);
export default Dashboard;
