import { useState } from 'react';

import { Flex, Input, Typography } from 'antd';

import StepFooter from './StepFooter';

const { Text } = Typography;

interface PasswordPromptProps {
    fileName: string;
    error?: boolean;
    onSubmit: (password: string) => void;
    onCancel: () => void;
}

const PasswordPrompt = ({ fileName, error, onSubmit, onCancel }: PasswordPromptProps) => {
    const [password, setPassword] = useState('');
    const submit = () => {
        if (password) onSubmit(password);
    };

    return (
        <Flex vertical gap={16} className="w-full">
            <Flex vertical gap={6}>
                <Text className="text-base font-medium text-ink">
                    This statement is password-protected
                </Text>
                <Text className="text-sm text-slate-500">
                    Enter the password for {fileName} to unlock and import it.
                </Text>
            </Flex>

            <Input.Password
                size="large"
                placeholder="Statement password"
                value={password}
                status={error ? 'error' : ''}
                onChange={event => setPassword(event.target.value)}
                onPressEnter={submit}
            />
            {error && (
                <Text className="text-xs text-danger">Incorrect password. Please try again.</Text>
            )}

            <StepFooter
                secondaryLabel="Cancel"
                onSecondary={onCancel}
                primaryLabel="Unlock &amp; Continue"
                onPrimary={submit}
            />
        </Flex>
    );
};

export default PasswordPrompt;
