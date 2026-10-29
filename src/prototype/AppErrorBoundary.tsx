// PROTOTYPE-SETUP: safety net that shows the real error (message + stack) instead of a blank screen or a
// generic "service not available" page. Resets when the route changes.
import { ReactNode } from 'react';

import { Alert, Button, Flex, Typography } from 'antd';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { useLocation } from 'react-router-dom';

export const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
    const err = error instanceof Error ? error : new Error(String(error));
    return (
        <Flex vertical gap={12} className="w-full min-w-0 p-4">
            <Alert
                type="error"
                showIcon
                message="Something broke while rendering this screen"
                description={
                    <Typography.Text strong className="break-words">
                        {err.name}: {err.message}
                    </Typography.Text>
                }
            />
            {err.stack && (
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 text-xs">
                    {err.stack}
                </pre>
            )}
            <Flex gap={8}>
                <Button type="primary" onClick={resetErrorBoundary}>
                    Try again
                </Button>
                <Button onClick={() => window.location.assign('/payroll')}>Go to Payroll</Button>
            </Flex>
        </Flex>
    );
};

const AppErrorBoundary = ({ children }: { children: ReactNode }) => {
    const { pathname } = useLocation();
    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            resetKeys={[pathname]}
            onError={(error, info) => console.error('[prototype] render error', error, info)}
        >
            {children}
        </ErrorBoundary>
    );
};

export default AppErrorBoundary;
