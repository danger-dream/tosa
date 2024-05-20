import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import ElementPlus from 'unplugin-element-plus/vite'

export default defineConfig({
	clearScreen: false,
	plugins: [
		vue(),
		vueJsx(),
		createSvgIconsPlugin({
			iconDirs: [resolve(process.cwd(), 'src/icons')],
			symbolId: 'icon-[name]',
		}),
		ElementPlus({})
	],
	server: {
		port: 8080,
		strictPort: true,
		open: false
	},
	build: {
		target: ['es2021', 'chrome97', 'safari13'],
		minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
		sourcemap: !!process.env.TAURI_DEBUG
	}
})
