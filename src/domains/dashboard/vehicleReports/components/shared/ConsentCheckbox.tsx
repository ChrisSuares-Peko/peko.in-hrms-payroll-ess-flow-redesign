import { Checkbox } from 'antd';

// Data-sharing consent shown above the pay button; the button stays disabled until
// this is ticked.
export const CONSENT_TEXT = {
    report: "I agree to share these vehicle details with Droom, Peko's certified partner, to generate this report. The report will be prepared and delivered by Droom.",
    inspection:
        "I agree to share these vehicle and contact details with Droom, Peko's certified partner, to schedule the inspection. A Droom technician will contact me and visit the provided address, and the report will be prepared by Droom.",
};

interface Props {
    text: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const ConsentCheckbox = ({ text, checked, onChange }: Props) => (
    <Checkbox checked={checked} onChange={e => onChange(e.target.checked)}>
        <span className="text-xs text-[#42526D]">{text}</span>
    </Checkbox>
);

export default ConsentCheckbox;
