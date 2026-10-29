import React, { useState } from 'react';

import { Button, Modal, Typography } from 'antd';

import { sanitizeHtml } from '../../utils/sanitizeHtml';

interface RequiredDocumentsButtonProps {
    label: string;
    text?: string;
    file?: string;
    className?: string;
}

// "Required documents" affordance shown on company-type / freezone cards. Opens
// a modal with admin-authored guidance (HTML) and an optional download link.
// Click-propagation is stopped so tapping it never selects the enclosing card.
const RequiredDocumentsButton: React.FC<RequiredDocumentsButtonProps> = ({
    label,
    text,
    file,
    className,
}) => {
    const [open, setOpen] = useState(false);

    if (!text && !file) return null;

    const stop = (e: React.SyntheticEvent) => {
        e.stopPropagation();
    };

    return (
        <>
            <button
                type="button"
                className={`text-xs font-medium text-lightRed underline underline-offset-2 ${className ?? ''}`}
                onMouseDown={stop}
                onPointerDown={stop}
                onClick={e => {
                    stop(e);
                    setOpen(true);
                }}
            >
                Required documents
            </button>

            <Modal
                open={open}
                title={`Required documents — ${label}`}
                onCancel={() => setOpen(false)}
                footer={
                    file
                        ? [
                              <Button key="close" onClick={() => setOpen(false)}>
                                  Close
                              </Button>,
                              <Button
                                  key="download"
                                  type="primary"
                                  danger
                                  href={file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                              >
                                  Download document
                              </Button>,
                          ]
                        : [
                              <Button key="close" onClick={() => setOpen(false)}>
                                  Close
                              </Button>,
                          ]
                }
            >
                {text ? (
                    <div
                        className="text-sm text-neutral-700 leading-relaxed peko-highlights [&_li_p]:my-0"
                        // Admin-authored HTML, sanitized (same model as HighlightsCard).
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
                    />
                ) : (
                    <Typography.Text className="text-sm text-neutral-500">
                        Download the document below for the required documents.
                    </Typography.Text>
                )}
            </Modal>
        </>
    );
};

export default RequiredDocumentsButton;
