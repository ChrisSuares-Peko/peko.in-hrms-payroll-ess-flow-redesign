import { Col, Row } from 'antd';

import AssetInformation from './AssetInformation';
import UserInformation from './UserInformation';

type Props = {
    assetData: any;
    setRefState: (num: number) => void;
    isLoading: boolean;
    data: any;
};

const BasicInformationTab = ({ assetData, setRefState, isLoading, data }: Props) => (
    <Row className="h-full ">
        <Col className="" xs={24} md={5}>
            <AssetInformation
                isLoading={isLoading}
                setRefState={setRefState}
                assetData={assetData}
            />
        </Col>
        <Col xs={0} md={1} className="border-l -mt-4" />
        <Col xs={24} md={17}>
            <UserInformation isLoading={isLoading} setRefState={setRefState} data={data} />
        </Col>
    </Row>
);

export default BasicInformationTab;
