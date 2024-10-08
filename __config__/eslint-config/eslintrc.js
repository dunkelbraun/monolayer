/** @type {import("eslint").Linter.Config} */
module.exports = {
	env: {
		browser: true,
		es2021: true,
		node: true,
	},
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"prettier",
	],
	overrides: [
		{
			env: {
				node: true,
			},
			files: [".eslintrc.{js,cjs}"],
			parserOptions: {
				sourceType: "script",
			},
		},
	],
	ignorePatterns: [
		"**/node_modules/**",
		"**/dist/**",
		"**/coverage/**",
		"**/tmp/**",
		"files/**",
		"**/docs/**",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module",
	},
	plugins: ["@typescript-eslint"],
	rules: {
		indent: ["off", "tab"],
		"linebreak-style": ["error", "unix"],
		quotes: ["off", "double"],
		semi: ["off", "always"],
		"max-lines": [
			"error",
			{ max: 300, skipComments: true, skipBlankLines: true },
		],
		complexity: ["error"],
	},
};
