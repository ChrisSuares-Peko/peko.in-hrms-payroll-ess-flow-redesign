import { useEffect, useState } from 'react';

import {
    BoldOutlined,
    ItalicOutlined,
    OrderedListOutlined,
    UnorderedListOutlined,
} from '@ant-design/icons';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button, Form, Space } from 'antd';
import { Field, FieldProps, getIn } from 'formik';

interface RichTextEditorFieldProps {
    name: string;
    label?: string;
    placeholder?: string;
    isDisabled?: boolean;
    isRequired?: boolean;
}

interface EditorProps {
    name: string;
    label?: string;
    placeholder?: string;
    isDisabled?: boolean;
    isRequired?: boolean;
    value?: string;
    error?: React.ReactNode;
    onChange: (value: string) => void;
    onBlur: () => void;
}

const RichTextEditorInner = ({
    name,
    label,
    placeholder,
    isDisabled,
    isRequired,
    value,
    error,
    onChange,
    onBlur,
}: EditorProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const [, forceUpdate] = useState({});

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                blockquote: false,
                codeBlock: false,
            }),
        ],
        content: value,
        editable: !isDisabled,
        editorProps: {
            attributes: {
                id: name,
                class: `outline-none text-base min-h-[80px] p-2 border rounded-md bg-white transition-all duration-200 [&_p]:m-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:m-0 ${
                    isDisabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''
                } ${isFocused ? 'border-[#ff4f4f] shadow-sm ring-1 ring-[#ff4f4f]' : 'border-gray-300'}`,
            },
        },
        onUpdate: ({ editor: currentEditor }) => {
            const html = currentEditor.getHTML();
            const isEmpty = currentEditor.isEmpty || html === '<p></p>' || html.trim() === '';
            onChange(isEmpty ? '' : html);
        },
        onSelectionUpdate: () => forceUpdate({}),
        onFocus: () => setIsFocused(true),
        onBlur: () => {
            setIsFocused(false);
            onBlur();
        },
    });

    useEffect(() => {
        if (editor && !editor.isDestroyed && value !== undefined && editor.getHTML() !== value) {
            editor.commands.setContent(value || '');
        }
    }, [value, editor]);

    useEffect(() => {
        if (editor && !editor.isDestroyed) editor.setEditable(!isDisabled);
    }, [isDisabled, editor]);

    if (!editor || editor.isDestroyed) return null;

    const toolbarButton = (icon: React.ReactNode, isActive: boolean, onClick: () => void) => (
        <Button
            icon={icon}
            size="small"
            type="text"
            disabled={isDisabled}
            className={`flex items-center justify-center w-8 h-8 border rounded ${
                isActive
                    ? 'bg-[#ff4f4f] border-[#ff4f4f] text-white'
                    : 'bg-white border-gray-300 text-black'
            }`}
            onClick={onClick}
        />
    );

    return (
        <Form.Item label={label} required={isRequired} validateStatus={error ? 'error' : ''} help={error}>
            <Space size={6} className="mb-1.5">
                {toolbarButton(<BoldOutlined />, editor.isActive('bold'), () =>
                    editor.chain().focus().toggleBold().run()
                )}
                {toolbarButton(<ItalicOutlined />, editor.isActive('italic'), () =>
                    editor.chain().focus().toggleItalic().run()
                )}
                {toolbarButton(<UnorderedListOutlined />, editor.isActive('bulletList'), () =>
                    editor.chain().focus().toggleBulletList().run()
                )}
                {toolbarButton(<OrderedListOutlined />, editor.isActive('orderedList'), () =>
                    editor.chain().focus().toggleOrderedList().run()
                )}
            </Space>
            <div className="relative">
                {editor.isEmpty && placeholder && (
                    <span className="absolute left-2 top-2 text-base text-gray-400 pointer-events-none">
                        {placeholder}
                    </span>
                )}
                <EditorContent editor={editor} />
            </div>
        </Form.Item>
    );
};

const RichTextEditorField: React.FC<RichTextEditorFieldProps> = ({
    name,
    label,
    placeholder,
    isDisabled,
    isRequired,
}) => (
    <Field name={name}>
        {({ field, form: { touched, errors, setFieldValue, setFieldTouched } }: FieldProps) => (
            <RichTextEditorInner
                name={name}
                label={label}
                placeholder={placeholder}
                isDisabled={isDisabled}
                isRequired={isRequired}
                value={field.value}
                error={getIn(touched, name) && getIn(errors, name) ? getIn(errors, name) : undefined}
                onChange={val => setFieldValue(name, val)}
                onBlur={() => setFieldTouched(name, true)}
            />
        )}
    </Field>
);

export default RichTextEditorField;
