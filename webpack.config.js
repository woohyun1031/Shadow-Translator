const path = require('path');
const { DefinePlugin } = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

// `npm run watch`만 development. `npm run build`는 --mode가 없으므로 production이다.
module.exports = (_env, argv) => ({
    mode: argv.mode || 'production',
    entry: {
        content: './src/content.ts',
        popup: './src/popup.ts',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true,
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        // __DEV__ 블록은 production 빌드에서 상수 false로 치환되고 minifier가 제거한다.
        new DefinePlugin({ __DEV__: JSON.stringify(argv.mode === 'development') }),
        new CopyPlugin({
            patterns: [
                { from: 'manifest.json', to: 'manifest.json' },
                { from: 'popup.html', to: 'popup.html' },
                { from: '_locales', to: '_locales' },
                { from: 'assets', to: 'assets', noErrorOnMissing: true },
            ],
        }),
    ],
});
