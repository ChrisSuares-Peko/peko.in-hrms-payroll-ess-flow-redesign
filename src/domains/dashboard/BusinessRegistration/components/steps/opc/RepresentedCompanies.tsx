import { InfoCircleOutlined } from '@ant-design/icons';
import { Col, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { COUNTRIES } from '../../../utils/countries';
import { isRepresentativeRole } from '../../../utils/proprietorKyc';

const { Text } = Typography;

interface Director {
    firstName?: string;
    lastName?: string;
    promoterType?: string;
}

// "Director and Representative" body-corporate details (vendor doc, Screenshot 5).
// Rendered on the Shareholder page only when at least one director carries the
// representative role. For an Indian company the details come from the MCA Name
// API; for a foreign company they are entered manually. The MCA auto-fetch and
// the vendor submission are blocked on the vendor (blocker #1) — for now the
// details are captured manually and stored on the director.
const RepresentedCompanies = () => {
    const { values } = useFormikContext<{ directors?: Director[] }>();
    const directors = values.directors || [];
    const reps = directors
        .map((d, index) => ({ d, index }))
        .filter(({ d }) => isRepresentativeRole(d?.promoterType));

    if (!reps.length) return null;

    return (
        <div className="flex flex-col gap-3">
            <div>
                <Text className="!text-[16px] !font-semibold !text-[#1e293b]">Represented Body Corporate</Text>
                <Text className="!block !text-[13px] !text-[#6a7282]">
                    Details of the company each &quot;Director and Representative&quot; represents.
                </Text>
            </div>

            <div className="bg-[#eff6ff] flex gap-2 items-start px-3 py-[10px] rounded-[8px]">
                <InfoCircleOutlined className="text-[#2563eb] mt-[2px]" style={{ fontSize: 15 }} />
                <Text className="!text-[13px] !text-[#1e40af] !leading-[20px]">
                    For an Indian company these details are verified against the MCA records. For a
                    company incorporated outside India, enter the details manually.
                </Text>
            </div>

            {reps.map(({ d, index }) => {
                const n = (field: string) => `directors.${index}.representedCompany.${field}`;
                const name = [d?.firstName, d?.lastName].filter(Boolean).join(' ') || `Director ${index + 1}`;
                return (
                    <div key={index} className="border border-[#e4e4e7] rounded-[16px] p-4 flex flex-col gap-2">
                        <Text className="!text-[14px] !font-medium !text-[#1e293b]">Represented by {name}</Text>
                        {/* Vertical gutter: these wrap to two rows even on desktop, and stack
                            entirely on mobile — at 0 the fields ran together with no spacing. */}
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={12}>
                                <SelectInput label="Company's Country" name={n('country')} options={COUNTRIES} placeholder="Select country" showSearch isRequired size="large" />
                            </Col>
                            <Col xs={24} md={12}>
                                <TextInput label="Company Name" name={n('name')} type="text" placeholder="Registered company name" isRequired size="large" />
                            </Col>
                            <Col xs={24} md={12}>
                                <TextInput label="CIN / Registration Number" name={n('cin')} type="text" placeholder="e.g. U74999MH2020PTC000000" isRequired size="large" />
                            </Col>
                            <Col xs={24} md={12}>
                                <TextInput label="Contact (email / mobile)" name={n('contact')} type="text" placeholder="Company contact" isRequired size="large" />
                            </Col>
                            <Col xs={24}>
                                <TextInput label="Registered Office Address" name={n('registeredOffice')} type="text" placeholder="Registered office address" isRequired size="large" />
                            </Col>
                        </Row>
                    </div>
                );
            })}
        </div>
    );
};

export default RepresentedCompanies;
