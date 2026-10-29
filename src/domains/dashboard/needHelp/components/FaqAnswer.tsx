import { Fragment } from 'react';

import { Flex, Typography } from 'antd';

type AnswerBlock = { kind: 'paragraph'; text: string } | { kind: 'list'; items: string[] };

const EMAIL_PATTERN = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/;
const BULLET_PREFIX = '- ';

const toBlocks = (answer: string): AnswerBlock[] =>
    answer
        .split(/\n\s*\n/)
        .map(block => block.trim())
        .filter(Boolean)
        .map(block => {
            const lines = block.split('\n');
            return lines.every(line => line.startsWith(BULLET_PREFIX))
                ? { kind: 'list', items: lines.map(line => line.slice(BULLET_PREFIX.length)) }
                : { kind: 'paragraph', text: block };
        });

const withEmailLinks = (text: string) =>
    text.split(EMAIL_PATTERN).map((part, index) =>
        index % 2 === 1 ? (
            <Typography.Link
                key={`${part}-${index}`}
                href={`mailto:${part}`}
                underline
                className="!text-inherit"
            >
                {part}
            </Typography.Link>
        ) : (
            <Fragment key={`${part}-${index}`}>{part}</Fragment>
        )
    );

const FaqAnswer = ({ answer }: { answer: string }) => (
    <Flex vertical gap={24} className="text-base leading-[1.6] text-slate-600">
        {toBlocks(answer).map(block =>
            block.kind === 'list' ? (
                <ul key={block.items.join('|')} className="m-0 list-disc ps-6">
                    {block.items.map(item => (
                        <li key={item}>{withEmailLinks(item)}</li>
                    ))}
                </ul>
            ) : (
                <Typography.Paragraph
                    key={block.text}
                    className="!mb-0 whitespace-pre-line text-base leading-[1.6] text-slate-600"
                >
                    {withEmailLinks(block.text)}
                </Typography.Paragraph>
            )
        )}
    </Flex>
);

export default FaqAnswer;
