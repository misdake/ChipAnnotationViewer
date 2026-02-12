const path = require('path');

module.exports = env => {
    let devtool = env && env.production ? undefined : "source-map";
    let mode = env && env.production ? 'production' : 'development';
    return {
        entry: './ts/App.ts',
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
            filename: 'app.js'
        },
        externals: {},
        devServer: {
            static: path.join(__dirname, 'dist'),
            open: true,
            hot: true,
            compress: true,
            port: 3000
        },
    };
};
