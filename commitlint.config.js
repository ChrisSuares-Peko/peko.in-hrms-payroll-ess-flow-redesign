module.exports = {
    parserPreset: 'conventional-changelog-conventionalcommits',
    rules: {
        'body-leading-blank': [1, 'always'],
        'agro-core-prefix': [2, 'always'],
        'body-max-line-length': [2, 'always', 100],
        'footer-leading-blank': [1, 'always'],
        'footer-max-line-length': [2, 'always', 100],
        'header-max-length': [2, 'always', 100],
        'subject-case': [
            2,
            'always',
            ['sentence-case', 'start-case', 'pascal-case', 'upper-case', 'lower-case'],
        ],
        'subject-empty': [1, 'never'],
        'subject-full-stop': [2, 'never', '.'],
        'type-case': [2, 'always', 'lower-case'],
        'type-empty': [2, 'never'],
        'type-enum': [2, 'never'],
    },
    plugins: [
        {
            rules: {
                'agro-core-prefix': ({ subject, type }) => {
                    // Check if the type is not null
                    if (!type) {
                        return [
                            false,
                            'You should have type in the commit message - possible types: fix|chore|build|ci|docs|refactor|revert|test|feat|style',
                        ];
                    }

                    // Phrase synchronization
                    if (type === 'Update translations from Phrase') {
                        return [true];
                    }

                    // Merge master into feature branch
                    if (type.includes('Merge branch')) {
                        return [true];
                    }

                    const regex = /fix|chore|build|ci|docs|refactor|revert|test|feat|style/;

                    // Test for specific type enums
                    if (!regex.test(type)) {
                        return [
                            false,
                            'You should use any of these types: fix || chore || build || ci || docs || refactor || revert || test || feat || style',
                        ];
                    }

                    if (!subject) {
                        return [
                            false,
                            'You should have subject in the commit message - example Fix: Adding new column',
                        ];
                    }

                    return ['true', 'You made a correct commit message'];
                },
            },
        },
    ],
};
