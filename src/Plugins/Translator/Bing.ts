import { fetch } from '../../Background'
import { IBaseTransService } from '../../types'

const DefaultTokenURL = 'https://edge.microsoft.com/translate/auth'
const DefaultURL = 'https://api-edge.cognitive.microsofttranslator.com'
export const Bing: IBaseTransService = {
	name: 'bing',
	label: '必应翻译',
	icon: '/icon/bing.svg',
	explain: '使用必应网页翻译接口',
	languages: {
		auto: '',
		zh_cn: 'zh-Hans',
		zh_tw: 'zh-Hant',
		yue: 'yue',
		en: 'en',
		ja: 'ja',
		ko: 'ko',
		fr: 'fr',
		es: 'es',
		ru: 'ru',
		de: 'de',
		it: 'it',
		tr: 'tr',
		pt_pt: 'pt-pt',
		pt_br: 'pt',
		vi: 'vi',
		id: 'id',
		th: 'th',
		ms: 'ms',
		ar: 'ar',
		hi: 'hi',
		mn_cy: 'mn-Cyrl',
		mn_mo: 'mn-Mong',
		km: 'km',
		nb_no: 'nb',
		fa: 'fa',
		sv: 'sv',
		pl: 'pl',
		nl: 'nl'
	},
	ui: [
		{ name: 'token_url', label: 'Token获取地址', type: 'input', default: DefaultTokenURL, explain: '必应TOKEN接口地址，若无必要请勿修改' },
		{ name: 'url', label: '接口地址', type: 'input', default: DefaultURL, explain: '必应翻译Api接口地址，若无必要请勿修改' },
	],
	async Detect(params: Record<string, string>, text: string): Promise<string> {
		let {token_url, url} = params
		if (!token_url) token_url = DefaultTokenURL
		if (!url) url = DefaultURL

		const token = await fetch(token_url, {
			method: 'GET',
			headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42' },
			responseType: 2
		})
		if (token.ok) {
			const res = await fetch(url + '/detect', {
				method: 'POST',
				headers: {
					accept: '*/*',
					'accept-language': 'zh-TW,zh;q=0.9,ja;q=0.8,zh-CN;q=0.7,en-US;q=0.6,en;q=0.5',
					authorization: 'Bearer ' + token.data,
					'cache-control': 'no-cache',
					'content-type': 'application/json',
					pragma: 'no-cache',
					'sec-ch-ua': '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
					'sec-ch-ua-mobile': '?0',
					'sec-ch-ua-platform': '"Windows"',
					'sec-fetch-dest': 'empty',
					'sec-fetch-mode': 'cors',
					'sec-fetch-site': 'cross-site',
					Referer: 'https://appsumo.com/',
					'Referrer-Policy': 'strict-origin-when-cross-origin',
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42'
				},
				query: { 'api-version': '3.0' },
				body: [{ Text: text }]
			})
			if (res.ok) {
				let result = res.data
				if (result[0].language) {
					return result[0].language
				}
			}
		}
		return 'en'
	},
	async Translate(params: Record<string, string>, text: string, from: string, to: string): Promise<string> {
		let { token_url, url } = params
		if (!token_url) token_url = DefaultTokenURL
		if (!url) url = DefaultURL
		const token = await fetch(token_url, {
			method: 'GET',
			headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42' },
			responseType: 2
		})
		if (token.ok) {
			url += '/translate'
			const res = await fetch<any>(url, {
				method: 'POST',
				headers: {
					accept: '*/*',
					'accept-language': 'zh-TW,zh;q=0.9,ja;q=0.8,zh-CN;q=0.7,en-US;q=0.6,en;q=0.5',
					authorization: 'Bearer ' + token.data,
					'cache-control': 'no-cache',
					'content-type': 'application/json',
					pragma: 'no-cache',
					'sec-ch-ua': '"Microsoft Edge";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
					'sec-ch-ua-mobile': '?0',
					'sec-ch-ua-platform': '"Windows"',
					'sec-fetch-dest': 'empty',
					'sec-fetch-mode': 'cors',
					'sec-fetch-site': 'cross-site',
					Referer: 'https://appsumo.com/',
					'Referrer-Policy': 'strict-origin-when-cross-origin',
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.42'
				},
				query: {
					from: from,
					to: to,
					'api-version': '3.0',
					includeSentenceLength: 'true'
				},
				body: [{ Text: text }]
			})
			if (res.ok) {
				let result = res.data
				if (result[0]['translations']) {
					return result[0]['translations'][0].text.trim()
				} else {
					throw JSON.stringify(result)
				}
			} else {
				throw `Http Request Error\nHttp Status: ${ res.status }\n${ JSON.stringify(res.data) }`
			}
		} else {
			throw 'Get Token Failed'
		}
	}
}
