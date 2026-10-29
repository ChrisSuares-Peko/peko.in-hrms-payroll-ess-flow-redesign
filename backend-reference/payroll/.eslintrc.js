module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "commonjs": true,
        "es2021": true,
        "jest": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:jest/recommended"
    ],
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "plugins": [
        "jest",
        "import"
    ],
    "settings": {
        "import/core-modules": ["uuid"],
        "import/resolver": {
            "node": {
                "extensions": [".js", ".json"]
            }
        }
    },
    "rules": {
        "import/no-unresolved": ["error", { "commonjs": true }]
    }
}
