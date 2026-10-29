module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true,
        "node": true,
        "jest": true
    },
    "extends":["eslint:recommended","plugin:jest/recommended"],
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
