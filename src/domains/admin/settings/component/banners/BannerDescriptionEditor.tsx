import { useEffect, useState } from 'react';

import { BoldOutlined, ItalicOutlined } from '@ant-design/icons';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button, Space } from 'antd';
import '../../assets/styles.css';

type Props = {
    value?: string;
    onChange?: (value: string) => void;
};

const BannerDescriptionEditor = ({ value, onChange }: Props) => {
    // 1. State for styling focus ring (Premium UX)
    const [isFocused, setIsFocused] = useState(false);

    // 2. Dummy state to force re-render for toolbar buttons
    const [, forceUpdate] = useState({});

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                bulletList: false,
                orderedList: false,
                blockquote: false,
                codeBlock: false,
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: `outline-none text-sm min-h-[80px] p-2 border rounded-md bg-white transition-all duration-200 ${isFocused ? 'border-brandColor shadow-sm ring-1 ring-blue-500' : 'border-gray-300'}`,
            },
        },
        onUpdate: ({ editor: currentEditor }) => {
            const html = currentEditor.getHTML();
            // If content is empty (only contains empty paragraph tags), return empty string
            const isEmpty = currentEditor.isEmpty || html === '<p></p>' || html.trim() === '';
            onChange?.(isEmpty ? '' : html);
        },
        onSelectionUpdate: () => {
            forceUpdate({});
        },
        onFocus: () => setIsFocused(true),
        onBlur: () => setIsFocused(false),
    });

    // Sync external value changes with editor
    useEffect(() => {
        if (editor && value !== undefined && editor.getHTML() !== value) {
            // Only update if content is different to avoid cursor jumps/loops
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) return null;

    return (
        <>
            {/* Toolbar */}
            <Space size={6} className="banner-editor-toolbar">
                <Button
                    icon={<BoldOutlined />}
                    size="small"
                    className={`banner-editor-button ${editor.isActive('bold') ? 'active' : ''}`}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                />
                <Button
                    icon={<ItalicOutlined />}
                    size="small"
                    className={`banner-editor-button ${editor.isActive('italic') ? 'active' : ''}`}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                />
            </Space>

            {/* Editor */}
            <EditorContent editor={editor} />
        </>
    );
};

export default BannerDescriptionEditor;
