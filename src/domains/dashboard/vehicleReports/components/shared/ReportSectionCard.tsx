import { ReactNode } from 'react';

import { Form as AntForm, Typography } from 'antd';

interface Props {
    title: string;
    children: ReactNode;
    // Extra classes on the outer card, e.g. spacing overrides.
    classes?: string;
}

// Titled card used by every report form: a bordered header row followed by a
// padded body. Thirteen instances across the valuation, history and inspection
// screens, so the chrome lives here rather than being repeated per section.
//
// The AntForm wrapper exists only to put the atomic inputs' Form.Items into
// vertical layout — the pages render Formik's <Form>, so without an antd Form in
// scope every label would sit inline to the left of its control. `component={false}`
// supplies the context without emitting a nested <form> element.
const ReportSectionCard = ({ title, children, classes = '' }: Props) => (
    <div className={`rounded-2xl bg-white shadow-[0px_2px_20px_rgba(0,0,0,0.04)] ${classes}`}>
        <div className="border-b border-[#EFF1F4] px-5 py-4">
            <Typography.Text className="text-base font-medium text-[#0A0A0A]">
                {title}
            </Typography.Text>
        </div>
        <AntForm layout="vertical" component={false}>
            {/* Form.Item margins are zeroed so the Row's vertical gutter owns the
                spacing — row-gap adds nothing after the last row, so the card gets no
                trailing gap. */}
            <div className="p-5 [&_.ant-form-item-label>label]:!text-[#475569] [&_.ant-form-item]:!mb-0">
                {children}
            </div>
        </AntForm>
    </div>
);

export default ReportSectionCard;
