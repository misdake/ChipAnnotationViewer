import typescript from 'rollup-plugin-typescript2';
import serve from 'rollup-plugin-serve'
import minify from 'rollup-plugin-babel-minify';

export default {
    input: './ts/App.ts',
    output: {
        file: './dist/app.min.js',
        name: 'app',
        format: 'umd',
    },
    plugins: [
        typescript(),
        minify({}),
        serve({contentBase: '', openPage: '/', open: true}),
    ],
}
