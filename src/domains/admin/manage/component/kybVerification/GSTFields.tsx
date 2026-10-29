import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

import ListItem from './ListItem';

const GSTFields = ({ data }: any) => (
    <>
        <ListItem property="Legal Business Name" value={data?.legalNameOfBusiness?.toLowerCase()} />
        <ListItem
            property="Trade Name of Business"
            value={data?.verificationResponse?.trade_name_of_business}
        />
        <ListItem
            property="Constitution of Business"
            value={data?.verificationResponse?.constitution_of_business}
        />
        <ListItem
            property="Principal Place Address"
            value={data?.verificationResponse?.principal_place_address}
        />
        <ListItem property="GST Status" value={data?.verificationResponse?.gst_in_status} />
        <ListItem
            property="Valid"
            value={data?.verificationResponse?.valid ? <CheckOutlined /> : <CloseOutlined />}
        />
    </>
);

export default GSTFields;
