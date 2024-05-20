import { createApp } from 'vue'
import { initBackground, getLabel } from './Background'
import 'virtual:svg-icons-register'
import SvgIcon from './icons/SvgIcon.vue'
import './style.css'

initBackground().then(async () => {
	const label = getLabel()
	try {
		// 在初始化后端接口后在使用import加载
		const config = await (await import('./Configuration.ts')).useConfig()
		let app_templ: any
		if (label === 'screen-capture') {
			app_templ = await import('./ScreenCapture/App.vue')
		} else if (label === 'translator') {
			await (await import('./Translator/Store')).TranslatorStore.init(config)
			app_templ = await import('./Translator/App.vue')
		} else if (label === 'setting') {
			app_templ = await import('./Setting/App.vue')
		} else if (label === 'selection-translator') {
			app_templ = await import('./SelectionTranslator/App.vue')
		} else if (label === 'mini') {
			app_templ = await import('./MiniTranslator/App.vue')
		}
		const app = createApp(app_templ.default)
		app.component('SvgIcon', SvgIcon)
		app.mount('#app')
	} catch (e) {
		console.error(e)
		//closeWindow()
	}
})