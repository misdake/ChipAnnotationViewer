const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

module.exports = env => {
    const confName = (env && env.conf) ? env.conf : 'dev';
    const confPath = path.join(__dirname, `viewer_conf.${confName}.json`);
    const exampleConfPath = path.join(__dirname, `viewer_conf.${confName}.example.json`);
    const resolvedConfPath = fs.existsSync(confPath) ? confPath : exampleConfPath;
    const conf = JSON.parse(fs.readFileSync(resolvedConfPath).toString());

    let devtool = env && env.production ? undefined : "source-map";
    let mode = env && env.production ? 'production' : 'development';

    return {
        entry: {
            app: './ts/App.ts',
            login: './ts/login.ts',
            comments: './ts/comments.ts',
        },
        devtool: devtool,
        mode: mode,
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader'
                }
            ]
        },
        resolve: {
            extensions: ['.ts', '.js', '.html']
        },
        output: {
            path: path.join(__dirname, 'dist'),
            filename: '[name].js'
        },
        plugins: [
            new webpack.DefinePlugin({
                __API_SERVER__: JSON.stringify(conf.API_SERVER),
            }),
        ],
        externals: {},
        devServer: {
            static: path.join(__dirname, 'dist'),
            open: true,
            hot: true,
            compress: true,
            port: conf.DEV_SERVER_PORT || 9000
        },
    };
};
