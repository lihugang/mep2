const { defineConfig } = require('@vue/cli-service');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const zlib = require('zlib');
const path = require('path');
module.exports = defineConfig({
    productionSourceMap: true,
    transpileDependencies: true,
    configureWebpack: config => {
        return {
            module: {
                rules: [
                    {
                        exclude: [path.join(__dirname, 'node_modules/')],
                        test: /\.worker\.js$/,
                        use: 'worker-loader'
                    }
                ]
            },
            plugins: [
                new MonacoWebpackPlugin(),
                ...(process.env.NODE_ENV === 'production')
                    ? [
                        new CompressionPlugin({
                            algorithm: 'gzip',
                            test: /\.js$|\.html$|\.css$|\.txt$|\.json$|\.svg$|\.map$|\.ttf$|\.woff$|\.woff2$/,
                            filename: '[path][name][ext].gz',
                            minRatio: 1,
                            threshold: 1,
                            deleteOriginalAssets: false
                        }),
                        new CompressionPlugin({
                            algorithm: 'brotliCompress',
                            test: /\.js$|\.html$|\.css$|\.txt$|\.json$|\.svg$|\.map$/,
                            filename: '[path][name][ext].br',
                            compressionOptions: {
                                params: {
                                    [zlib.constants.BROTLI_PARAM_QUALITY]: 11
                                }
                            },
                            minRatio: 0.8,
                            threshold: 20480,
                            deleteOriginalAssets: false
                        })
                    ]
                    : []

            ],
            ...(process.env.NODE_ENV === 'production')
                ? {
                    optimization: {
                        runtimeChunk: 'single',
                        splitChunks: {
                            chunks: 'all',
                            maxInitialRequests: 4,
                            maxAsyncRequests: 6,
                            minSize: 30000,
                            maxSize: 2000000,
                            automaticNameDelimiter: '.',
                            minChunks: 3,
                            cacheGroups: {
                                vendors: {
                                    test: /[\\/]node_modules[\\/]/,
                                    priority: -10,
                                    name: (module) => {
                                        const packageName = (module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/) || [null, 'unknown_module.' + new Date().getTime()])[1];
                                        return `${packageName.replace('@', '')}`;
                                    }
                                }
                            }
                        }
                    }
                }
                : {}
        };
    }
});
