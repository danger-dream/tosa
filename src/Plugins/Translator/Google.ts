import { fetch } from '../../Background'
import { IBaseTransService } from '../../types'

const DefaultURL = 'https://translation.googleapis.com/language/translate/v2'
export const Google: IBaseTransService = {
	name: 'google',
	label: '谷歌翻译',
	icon: '/icon/google.svg',
	explain: '使用『Google Cloud』接口，需要申请Api Key',
	helpLink: 'https://cloud.google.com/translate/docs/basic/detecting-language',
	languages: {
		auto: 'auto',
		zh_cn: 'zh-CN',
		zh_tw: 'zh-TW',
		ja: 'ja',
		en: 'en',
		ko: 'ko',
		fr: 'fr',
		es: 'es',
		ru: 'ru',
		de: 'de',
		it: 'it',
		tr: 'tr',
		pt_pt: 'pt',
		pt_br: 'pt',
		vi: 'vi',
		id: 'id',
		th: 'th',
		ms: 'ms',
		ar: 'ar',
		hi: 'hi',
		mn_cy: 'mn',
		km: 'km',
		nb_no: 'no',
		nn_no: 'no',
		fa: 'fa',
		sv: 'sv',
		pl: 'pl',
		nl: 'nl'
	},
	ui: [
		{ name: 'url', label: '连接地址', type: 'input', default: DefaultURL, explain: '谷歌翻译Api接口地址，若无必要请勿修改' },
		/*{ name: 'projectId', label: 'projectId', type: 'input', default: '', explain: '' },*/
		{ name: 'apiKey', label: 'Api Key', type: 'password' }
	],
	async Translate(params: Record<string, any>, text: string, _from: string, to: string): Promise<string> {
		let { url, apiKey } = params
		if (!apiKey) throw 'Api Key is required'
		if (!url) url = DefaultURL

		const res = await fetch<any>(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json;charset=UTF-8' },
			query: { key: apiKey },
			body: { q: text, target: to }
		})
		if (!res.ok) {
			throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`
		}
		const { data } = res.data
		if (data) {
			const { translations } = data as any
			return (Array.isArray(translations) ? translations[0] : translations)['translatedText']
		}
		throw new Error(JSON.stringify(res.data))
	},
	async Detect(params: Record<string, any>, text: string): Promise<string> {
		let { url, apiKey } = params
		if (!apiKey) throw 'Api Key is required'
		if (!url) url = DefaultURL

		const res = await fetch<any>(url + '/detect?key=' + apiKey + '&q=' + encodeURI(text))
		if (!res.ok) {
			throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`
		}
		const { data } = res.data
		if (data) {
			const { detections } = data as any
			return detections[0][0]['language']
		}
		throw new Error(JSON.stringify(res.data))
	}
}
