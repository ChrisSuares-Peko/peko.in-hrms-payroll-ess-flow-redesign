import { Typography } from 'antd';
import { useFormikContext } from 'formik';

import messageQuestionIcon from '../assets/message-question.svg';
import { EntityType } from '../types';

const { Text } = Typography;

// Signatory wording differs by entity: LLP signs as Designated Partner/Partner,
// Partnership as Partner, companies as Director/Shareholder (vendor correction).
const signatoryLabel = (entityType?: EntityType) => {
    if (entityType === EntityType.LLP) return 'Every Designated Partner and Partner';
    if (entityType === EntityType.PARTNERSHIP) return 'Every Partner';
    return 'Every Director and Shareholder';
};

// "Digital Signature Certificate" info card shown under the Relationship
// Manager card. Vendor decision 16-07: DSC is NOT a blocker — IndiaFilings
// arranges it internally via the RM once the application is received. The
// previous interactive version (Yes/No prompt + "Get your DSC" CTA) is kept
// commented out below in case the product decision reverses.
const DigitalSignatureCard = () => {
    const { values } = useFormikContext<{ entityType?: EntityType }>();
    return (
        <div className="bg-white rounded-[30px] p-6 shadow-[0px_1.5px_16.5px_0px_rgba(0,0,0,0.06)] flex gap-3 items-start">
            <img src={messageQuestionIcon} alt="" aria-hidden className="w-6 h-6 mt-[2px] flex-shrink-0" />
            <div className="flex flex-col gap-3 flex-1 min-w-0">
                <Text className="!text-[20px] !font-medium !text-black !leading-[1.2]">
                    Digital Signature Certificate
                </Text>
                <Text className="!text-[14px] !text-[#171717] !leading-[20px]">
                    {signatoryLabel(values.entityType)} needs a DSC to sign the incorporation
                    documents — but you don&apos;t need to arrange it yourself. Once your
                    application is received, your Relationship Manager will handle DSC
                    issuance for all signatories.
                </Text>
            </div>
        </div>
    );
};

/* Previous interactive version (Figma 2302:25182 / 2287:24804 / 2297:24859):

import { useState } from 'react';
import { Button } from 'antd';

type Choice = null | 'yes' | 'no';

const DigitalSignatureCard = () => {
    const [choice, setChoice] = useState<Choice>(null);

    const btnClass = (active: boolean) =>
        active
            ? 'flex-1 !h-[40px] !text-[16px] !font-medium !rounded-[8px] !bg-[#ff4f4f] !border-[#ff4f4f] !text-white hover:!bg-[#e64444] transition-colors'
            : 'flex-1 !h-[40px] !text-[16px] !rounded-[8px] !border-[#ff4f4f] !text-[#1e293b] hover:!bg-[#fff5f5] transition-colors';

    const handleGetDsc = () => {
        // TODO: route to Peko's Digital Signature service once that flow is wired.
    };

    return (
        <div className="bg-white rounded-[30px] p-6 shadow-[0px_1.5px_16.5px_0px_rgba(0,0,0,0.06)] flex gap-3 items-start">
            <QuestionCircleOutlined className="text-[#ff4f4f] mt-[2px]" style={{ fontSize: 24 }} />
            <div className="flex flex-col gap-4 flex-1 min-w-0">
                <Text className="!text-[20px] !font-medium !text-black !leading-[1.2]">
                    Digital Signature Certificate
                </Text>
                <Text className="!text-[14px] !text-[#171717] !leading-[20px]">
                    Every Director and Shareholder needs a DSC to sign the incorporation documents.
                    Do you need help obtaining one?
                </Text>
                <div className="flex gap-3 items-center">
                    <Button
                        type={choice === 'yes' ? 'primary' : 'default'}
                        onClick={() => setChoice('yes')}
                        className={btnClass(choice === 'yes')}
                    >
                        Yes
                    </Button>
                    <Button
                        type={choice === 'no' ? 'primary' : 'default'}
                        onClick={() => setChoice('no')}
                        className={btnClass(choice === 'no')}
                    >
                        No
                    </Button>
                </div>

                {choice && <div className="h-px w-full bg-[#ebebeb]" />}

                {choice === 'yes' && (
                    <div className="bg-[#faf8f7] rounded-[16px] p-4 flex flex-col gap-4">
                        <Text className="!text-[14px] !text-[#171717] !leading-[22px]">
                            Peko offers a dedicated Digital Signature service. Apply there and use
                            your DSC to complete the signing.
                        </Text>
                        <Button
                            type="primary"
                            onClick={handleGetDsc}
                            className="w-full !h-[40px] !text-[16px] !font-medium !rounded-[8px] !bg-[#ff4f4f] !border-[#ff4f4f] hover:!bg-[#e64444] transition-colors"
                        >
                            Get your DSC
                        </Button>
                    </div>
                )}

                {choice === 'no' && (
                    <Text className="!text-[12px] !text-[#686868] !leading-[18px]">
                        Great — please ensure each signatory&apos;s DSC is ready before submission.
                    </Text>
                )}
            </div>
        </div>
    );
};
*/

export default DigitalSignatureCard;
