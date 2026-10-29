/* eslint-disable react/prop-types */
import { Modal, Typography } from 'antd';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}
const { Text, Paragraph } = Typography;
const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => (
    <Modal
        title="Learn More About Google Workspace Commit Plans"
        open={isOpen}
        onCancel={onClose}
        footer={null}
        width={780}
    >
        <Paragraph strong>
            When you subscribe to a Google Workspace Commit Plan through Peko, the following terms
            and conditions apply:
        </Paragraph>

        <Paragraph className="mt-1">1-Year Commitment</Paragraph>
        <ul className="pl-5 list-disc mt-1">
            <li className="mb-2">
                <Text>This plan requires you to commit to a minimum of 1 year of service.</Text>
            </li>
            <li className="mb-2">
                <Text>
                    You cannot cancel the subscription or reduce the number of licenses during the
                    1-year period.
                </Text>
            </li>
            <li className="mb-2">
                <Text>
                    However, you can upgrade the number of licenses at any time to accommodate your
                    business growth.
                </Text>
            </li>
        </ul>
        <Paragraph strong className="mt-4">
            Payment Options
        </Paragraph>
        <ul className="pl-5 list-disc mt-1">
            <li className="mb-2">
                <Text>
                    You have the flexibility to choose how you want to pay for the subscription:
                </Text>
            </li>
            <ul className="pl-5 list-disc">
                <li className="mb-2">
                    <Text>
                        Monthly Payments: Spread the cost across monthly installments over the
                        1-year period.
                    </Text>
                </li>
                <li className="mb-2">
                    <Text>
                        Yearly Payments: Pay the entire subscription cost upfront for the year and
                        enjoy hassle-free billing.
                    </Text>
                </li>
            </ul>
        </ul>

        <Paragraph strong className="mt-4">
            What Happens at the End of the Commitment Period?
        </Paragraph>
        <ul className="pl-5 list-disc mt-1">
            <li className="mb-2">
                <Text>
                    At the end of the 1-year period, your subscription will automatically renew
                    unless you choose to modify or cancel it.
                </Text>
            </li>
        </ul>
        <Paragraph strong className="mt-4">
            Managing Licenses
        </Paragraph>
        <ul className="pl-5 list-disc mt-1">
            <li className="mb-2">
                <Text>
                    While you cannot decrease the number of licenses during the 1-year term, you can
                    increase the license count as needed.
                </Text>
            </li>
        </ul>
        <Paragraph strong className="mt-4">
            Why Choose a Commit Plan?
        </Paragraph>
        <ul className="pl-5 list-disc mt-1">
            <li className="mb-2">
                <Text>Lock in the subscription at a consistent rate for the full year.</Text>
            </li>
            <li className="mb-2">
                <Text>Scale easily with license upgrades when needed.</Text>
            </li>
            <li className="mb-2">
                <Text>
                    Access Google Workspace&apos;s full range of business tools with guaranteed
                    service availability.
                </Text>
            </li>
        </ul>

        <Paragraph strong className="mt-4">
            For any further queries, feel free to contact <Text>reach@peko.one</Text>.
        </Paragraph>
    </Modal>
);

export default TermsModal;
