import { useEffect } from 'react';

import { Col, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import indianFlag from '@assets/flagIndia.png';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

const { Text } = Typography;

const MobilePrefix = () => (
    <div className="flex items-center gap-[4px] whitespace-nowrap min-w-max cursor-default">
        <img src={indianFlag} alt="India" className="w-[18px] h-auto flex-shrink-0" />
        <span className="text-[#333] font-semibold text-[13px] flex-shrink-0">+91</span>
    </div>
);

interface ContactValues {
    primaryContact?: { fullName?: string; email?: string; mobile?: string };
}

// "Primary Contact Person Details" (Figma 1819:22914). Prefilled from the
// logged-in corporate account (state.reducer.user.user); editable here.
const PrimaryContact = () => {
    const { values, setFieldValue } = useFormikContext<ContactValues>();
    const user = useAppSelector(state => state.reducer.user.user) as
        | { contactPerson?: string; email?: string; mobileNo?: string }
        | undefined;

    useEffect(() => {
        if (!user) return;
        const pc = values.primaryContact || {};
        if (!pc.fullName && user.contactPerson) setFieldValue('primaryContact.fullName', user.contactPerson);
        if (!pc.email && user.email) setFieldValue('primaryContact.email', user.email);
        if (!pc.mobile && user.mobileNo) setFieldValue('primaryContact.mobile', user.mobileNo);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    return (
        <div className="flex flex-col gap-3">
            <Text className="!text-[18px] !font-semibold !text-[#1e293b] !leading-[26px]">
                Primary Contact Person Details
            </Text>
            <div className="border border-[#e4e4e7] rounded-[24px] p-3 sm:p-6">
                <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                        <TextInput label="Full name" name="primaryContact.fullName" type="text" placeholder="Full name" size="large" />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput label="Email address" name="primaryContact.email" type="text" placeholder="Email address" size="large" />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput
                            label="Mobile number"
                            name="primaryContact.mobile"
                            type="text"
                            placeholder="Mobile number"
                            maxLength={10}
                            allowNumbersOnly
                            size="large"
                            addonBefore={<MobilePrefix />}
                            formItemClass="static-phone-addon"
                        />
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default PrimaryContact;
