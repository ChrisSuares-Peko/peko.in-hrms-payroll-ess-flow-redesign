import { CheckOutlined } from '@ant-design/icons';

/** Nested green success tick used on confirmation screens (KYC submitted, card requested). */
const SuccessCheck = () => (
    <span className="rounded-full p-2.5" style={{ backgroundColor: '#E4FFE8' }}>
        <span className="flex rounded-full p-3" style={{ backgroundColor: '#ECFDF5' }}>
            <span
                className="flex size-12 items-center justify-center rounded-full text-xl"
                style={{ backgroundColor: '#43B75D', color: '#FFFFFF' }}
            >
                <CheckOutlined />
            </span>
        </span>
    </span>
);

export default SuccessCheck;
