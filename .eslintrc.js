module.exports = {
  env: {},
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'oclif',
    'oclif-typescript',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: {
      extends: 'tsconfig.json',
      include: ['**/*.ts'],
      exclude: [
        'node_modules/**/*',
        'src/templates/**/*',
        'lib/**/*',
        'tmp/**/*',
        'test/express/**/*',
        'test/nest/**/*',
        'test/test-output/**/*'
      ]
    },
    sourceType: 'module'
  },
  ignorePatterns: [
    '.eslintrc.js',
    'dist',
    'node_modules',
    'lib',
    'tmp',
    'test/express',
    'test/nest',
    'test/test-output'
  ],
  plugins: [
    '@typescript-eslint',
    'header',
    'import',
    'prettier',
    'unused-imports'
  ],
  overrides: [
    {
      files: ['**/test/**/*'],
      rules: {
        'import/no-internal-modules': 'off',
        'no-unused-expressions': 'off'
      }
    }
  ],
  rules: {
    '@typescript-eslint/array-type': 'error',
    '@typescript-eslint/class-name-casing': 'off',
    '@typescript-eslint/consistent-type-assertions': 'off',
    '@typescript-eslint/consistent-type-definitions': 'error',
    '@typescript-eslint/explicit-member-accessibility': [
      'off',
      {
        accessibility: 'explicit'
      }
    ],
    // "@typescript-eslint/indent": [
    //     "error",
    //     2,
    //     {
    //         "ObjectExpression": "first",
    //         "FunctionDeclaration": {
    //             "parameters": "first"
    //         },
    //         "FunctionExpression": {
    //             "parameters": "first"
    //         }
    //     }
    // ],
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'semi',
          requireLast: true
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false
        }
      }
    ],
    '@typescript-eslint/member-ordering': [
      'error',
      {
        default: [
          // Index signature
          'signature',

          // Static
          'public-static-field',
          'protected-static-field',
          'private-static-field',
          'public-static-method',
          'protected-static-method',
          'private-static-method',

          // Fields
          'public-instance-field',
          'protected-instance-field',
          'private-instance-field',
          'public-abstract-field',
          'protected-abstract-field',
          'private-abstract-field',

          // Constructors
          'public-constructor',
          'protected-constructor',
          'private-constructor',

          // Methods
          'public-instance-method',
          'protected-instance-method',
          'private-instance-method',
          'public-abstract-method',
          'protected-abstract-method',
          'private-abstract-method'
        ]
      }
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/prefer-for-of': 'error',
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/quotes': [
      'error',
      'single',
      {
        avoidEscape: true
      }
    ],
    '@typescript-eslint/semi': ['error', 'always'],
    '@typescript-eslint/type-annotation-spacing': 'error',
    '@typescript-eslint/unified-signatures': 'error',
    'arrow-body-style': 'error',
    'arrow-parens': ['off', 'as-needed'],
    'brace-style': 'error',
    camelcase: 'off',
    'comma-dangle': 'off',
    complexity: 'off',
    curly: 'error',
    'dot-notation': 'off',
    'eol-last': 'error',
    eqeqeq: ['error', 'smart'],
    'header/header': [
      'error',
      'block',
      {
        pattern:
          'Copyright \\(c\\) \\d{4} SAP SE or an SAP affiliate company. All rights reserved. ',
        template:
          'Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. ',
        lineEndings: 'unix'
      }
    ],
    'guard-for-in': 'off',
    'id-blacklist': 'off',
    'id-match': 'off',
    'import/no-absolute-path': 'error',
    'import/named': 'error',
    'import/no-extraneous-dependencies': 'off',
    'import/no-internal-modules': 'error',
    'import/order': 'error',
    indent: 'off',
    // Does not work for typescript yet
    // "lines-around-comment": [
    //     "error",
    //     {
    //         "beforeBlockComment": true,
    //         "beforeLineComment": true,
    //         "allowBlockStart": true,
    //         "allowBlockEnd": true,
    //         "allowObjectStart": true,
    //         "allowObjectEnd": true,
    //         "allowArrayStart": true,
    //         "allowArrayEnd": true,
    //         "allowClassStart": true,
    //         "allowClassEnd": true
    //     }
    // ],
    'max-classes-per-file': ['error', 1],
    'max-len': 'off',
    'new-parens': 'error',
    'no-bitwise': 'error',
    'no-caller': 'error',
    'no-console': 'error',
    'no-duplicate-imports': 'error',
    'no-else-return': ['error', { allowElseIf: false }],
    'no-eval': 'error',
    'no-extra-bind': 'error',
    'no-invalid-this': 'off',
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    '@typescript-eslint/no-redeclare': ['error'],
    'no-restricted-imports': ['error', '../', './'],
    'no-return-await': 'error',
    'no-sequences': 'error',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': [
      'error',
      {
        ignoreFunctionTypeParameterNameValueShadow: true,
        hoist: 'all'
      }
    ],
    'no-template-curly-in-string': 'error',
    'no-throw-literal': 'error',
    'no-trailing-spaces': 'error',
    'no-undef-init': 'error',
    'no-underscore-dangle': 'off',
    'no-unused-expressions': 'error',
    'no-var': 'error',
    'object-curly-spacing': ['error', 'always'],
    'object-shorthand': 'error',
    'one-var': ['error', 'never'],
    'padded-blocks': ['error', 'never'],
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: 'block' },
      { blankLine: 'never', prev: 'import', next: 'import' }
    ],
    'prefer-const': 'error',
    'prefer-object-spread': 'error',
    'prettier/prettier': 'error',
    'quote-props': 'off',
    radix: 'off',
    'space-in-parens': ['error', 'never'],
    'spaced-comment': 'error',
    'unused-imports/no-unused-imports-ts': 'error',
    semi: 'off',
    'unicorn/catch-error-name': 'off',
    'valid-jsdoc': [
      'error',
      {
        requireReturn: false,
        requireReturnType: false,
        requireParamType: false,
        prefer: {
          return: 'returns'
        }
      }
    ]
  }
};
