import typescript from 'rollup-plugin-typescript2';
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

export default {
    input: './ts/App.ts',
    output: {
        file: './dist/app.js',
        name: 'app',
        format: 'umd',
        sourcemap: true
    },
    plugins: [
        typescript(),
        serve({contentBase: '', open: true}),
        livereload(),
    ],
    watch: {
        include: 'ts/**',
    },
}
