module.exports = {
    "parserOptions": {
        "ecmaVersion": 2018,
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true
        }
    },
    "env": {
        "node": true,
        "es6": true,
    },
    "extends": ["eslint:recommended"],
    "rules": {
        "strict": ["error", "global"],

        // enable additional rules
        "indent": ["error", 2],
        "linebreak-style": ["error", "unix"],
        "semi": ["error", "always"],
        "quotes": ["error", "backtick"],
        "prefer-template": ["error"],
        "template-curly-spacing": ["error", "never"],
        "quote-props": ["error", "consistent-as-needed"],

        // override default options for rules from base configurations
        "comma-dangle": ["error", "only-multiline"],
        "no-cond-assign": ["error", "always"],

        // disable rules from base configurations
        "no-console": "warn",

        "no-unused-vars": "warn",

        // jest rules
        "jest/no-disabled-tests": "warn",
        "jest/no-focused-tests": "error",
        "jest/no-identical-title": "error",
        "jest/prefer-to-have-length": "warn",
        "jest/valid-expect": "error",

        // header rules
        "header/header": [2, "header.js"],

        "eol-last": ["error", "always"],
    }
};