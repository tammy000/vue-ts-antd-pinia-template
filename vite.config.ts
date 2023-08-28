import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import legacy from '@vitejs/plugin-legacy'
import styleImport from 'vite-plugin-style-import'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    styleImport({
      libs: [{
        libraryName: 'ant-design-vue',
        esModule: true,
        resolveStyle: (name) => {
          // 这里我没有引入less的css 文件因为我已经安装过了sass 不想重复安装一个预编译器。
          // 如果您的项目只需要ant 或者 两者都需要，请使用less。
          if (name === 'theme') {
            return ''; // 不引入 theme 组件的样式文件
          }
          return `ant-design-vue/es/${name}/style/index.js`
        },
        resolveComponent: (name) => {
          return `ant-design-vue/es/${name}/index.js`
        }
      }]
    }),
    legacy({
      targets: ['defaults', 'not IE 11']
    }),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: false, // css in js
        }),
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  base: './',
  server: {
    open: false,
    host: true,
    port: 4000,
    https: false,
    proxy: {
      '/api': {
        target: 'http://10.88.54.66:8600',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  },
  build: {
    base: '',
    outDir: 'dist',
    assetsDir: 'assets',
    // 小于此阈值的导入或引用资源将内联为base64编码，设置为0可禁用此项。默认4096（4kb）
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'terser'
  }
})
