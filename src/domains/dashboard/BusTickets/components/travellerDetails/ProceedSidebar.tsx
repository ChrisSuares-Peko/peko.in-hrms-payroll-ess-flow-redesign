import { useState } from 'react';

import { Button, Checkbox, Flex, Typography } from 'antd';

type Props = {
    onProceed: () => void;
    loading?: boolean;
};

export default function ProceedSidebar({ onProceed, loading }: Props) {
    const [agreed, setAgreed] = useState(true);

    return (
        <Flex
            vertical
            gap={28}
            style={{
                background: 'white',
                border: '1px solid #D9D9D9',
                borderRadius: 22,
                padding: 30,
            }}
        >
            <Checkbox checked={agreed} onChange={e => setAgreed(e.target.checked)}>
                <Typography.Text style={{ fontSize: 14, lineHeight: '22px' }}>
                    By checking this box, I understand and agree with the{' '}
                    <Typography.Link
                        href="https://peko.one/in/platform-agreement"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'underline' }}
                    >
                        Terms and Conditions
                    </Typography.Link>{' '}
                    and consent to the sharing of my details with Peko and the relevant Bus operator(s)
                </Typography.Text>
            </Checkbox>

            <Button
                type="primary"
                size="large"
                disabled={!agreed || loading}
                loading={loading}
                onClick={onProceed}
                style={{
                    background: '#FF4F4F',
                    borderColor: '#FF4F4F',
                    height: 48,
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 500,
                    width: '100%',
                }}
            >
                Proceed to review
            </Button>
        </Flex>
    );
}
