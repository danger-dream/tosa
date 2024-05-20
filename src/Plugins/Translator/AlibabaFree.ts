import { fetch } from '../../Background'
import { IBaseTransService } from '../../types'

const DefaultURL = 'https://translate.alibaba.com/api/translate/text'
export const AlibabaFree: IBaseTransService = {
	name: 'alibaba-free',
	label: '阿里巴巴翻译-免费版',
	icon: '/icon/alibaba.svg',
	languages: {
		auto : 'auto',
		zh_cn : 'zh',
		zh_tw : 'zh-tw',
		yue : 'yue',
		ja : 'ja',
		en : 'en',
		ko : 'ko',
		fr : 'fr',
		es : 'es',
		ru : 'ru',
		de : 'de',
		it : 'it',
		tr : 'tr',
		pt_pt : 'pt',
		pt_br : 'pt',
		vi : 'vi',
		id : 'id',
		th : 'th',
		ms : 'ms',
		ar : 'ar',
		hi : 'hi',
		mn_mo : 'mn',
		km : 'km',
		nb_no : 'no',
		nn_no : 'no',
		fa : 'fa',
		sv : 'sv',
		pl : 'pl',
		nl : 'nl',
	},
	ui: [
		{ name: 'url', label: '连接地址', type: 'input', default: DefaultURL, explain: '阿里巴巴翻译接口地址，若无必要请勿修改' },
	],
	async Translate(params: Record<string, any>, text: string, from: string, to: string): Promise<string> {
		let { url } = params
		if (!url) url = DefaultURL
		const res = await fetch(url, {
			method: 'GET',
			query: { domain: 'general', query: encodeURIComponent(text), srcLang: from, tgtLang: to }
		})
		if (!res.ok) {
			throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`
		}
		const { success, data } = res.data as any
		if (success && data) {
			const { translateText } = data as any
			return translateText
		}
		throw new Error(JSON.stringify(res.data))
	}
}
