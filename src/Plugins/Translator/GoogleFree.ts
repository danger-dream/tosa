import { fetch } from '../../Background'
import { IBaseTransService, IDictResult } from '../../types'

const DefaultURL = 'https://translate.google.com'
export const GoogleFree: IBaseTransService = {
	name: 'google-free',
	label: '谷歌翻译-免费版',
	icon: '/icon/google-free.svg',
	explain: '使用谷歌网页翻译接口，可修改为cloudflare代理',
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
		{ name: 'url', label: '连接地址', type: 'input', default: DefaultURL, explain: '谷歌翻译Api接口地址' }
	],
	async Translate(params: Record<string, any>, text: string, from: string, to: string): Promise<string> {
		let { url } = params
		if (!url) url = DefaultURL

		const res = await fetch<any>(
			`${ url }/translate_a/single?dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t`,
			{
				method: 'GET',
				headers: { 'content-type': 'application/json' },
				query: {
					client: 'gtx',
					sl: from,
					tl: to,
					hl: to,
					ie: 'UTF-8',
					oe: 'UTF-8',
					otf: '1',
					ssel: '0',
					tsel: '0',
					kc: '7',
					q: text
				}
			}
		)
		if (res.ok) {
			const data = res.data
			if (data[1]) {
				return data[0][0][0]
			} else {
				// 翻译模式
				let result = ''
				for (let r of data[0]) {
					if (r[0]) {
						result += r[0]
					}
				}
				return result.trim()
			}
		} else {
			throw `Http Request Error\nHttp Status: ${ res.status }\n${ JSON.stringify(res.data) }`
		}
	},
	async Dict(params: Record<string, string>, text: string, from: string, to: string): Promise<IDictResult> {
		let { url } = params
		if (!url) url = DefaultURL

		const res = await fetch<any>(
			`${ url }/translate_a/single?dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t`,
			{
				method: 'GET',
				headers: { 'content-type': 'application/json' },
				query: {
					client: 'gtx',
					sl: from,
					tl: to,
					hl: to,
					ie: 'UTF-8',
					oe: 'UTF-8',
					otf: '1',
					ssel: '0',
					tsel: '0',
					kc: '7',
					q: text
				}
			}
		)
		if (res.ok) {
			const data = res.data
			const result = { text: '', pronunciations: [], explanations: [], sentence: [] } as IDictResult
			// 词典模式
			if (data[1]) {
				result.text = data[0][0][0]
				// 发音
				if (data[0][1][3]) {
					result.pronunciations.push({ symbol: data[0][1][3], voice: '' })
				}
				// 释义
				for (let i of data[1]) {
					result.explanations.push({ trait: i[0], explains: i[2].map((x: any) => x[0]) })
				}
				// 例句
				if (data[13]) {
					for (let i of data[13][0]) {
						result.sentence.push(i[0])
					}
				}
			} else {
				// 翻译模式
				for (let r of data[0]) {
					if (r[0]) {
						result.text += r[0]
					}
				}
			}
			return result
		} else {
			throw `Http Request Error\nHttp Status: ${ res.status }\n${ JSON.stringify(res.data) }`
		}
	},
	async Detect(params: Record<string, any>, text: string): Promise<string> {
		let { url } = params
		if (!url) url = DefaultURL
		let res = await fetch<any>(
			`${ url }/translate_a/single?dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t`,
			{
				method: 'GET',
				headers: { 'content-type': 'application/json' },
				query: {
					client: 'gtx',
					sl: 'auto',
					tl: 'zh-CN',
					hl: 'zh-CN',
					ie: 'UTF-8',
					oe: 'UTF-8',
					otf: '1',
					ssel: '0',
					tsel: '0',
					kc: '7',
					q: text
				}
			}
		)
		if (res.ok) {
			const result = res.data
			if (result[2]) {
				return result[2]
			}
		}
		return 'en'
	}
}
