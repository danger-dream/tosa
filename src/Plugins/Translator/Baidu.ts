import { fetch, IResponse } from '../../Background'
import { MD5 } from 'crypto-js'
import { IBaseTransService } from '../../types'

const DefaultURL = 'https://fanyi-api.baidu.com/api/trans/vip/translate'
export const Baidu: IBaseTransService = {
	name: 'baidu',
	label: '百度翻译',
	icon: '/icon/baidu.svg',
	explain: '使用『百度翻译开放平台』接口，需要申请App ID、Secret',
	helpLink: 'https://api.fanyi.baidu.com/doc/21',
	languages: {
		auto: 'auto',
		zh_cn: 'zh',
		zh_tw: 'cht',
		yue: 'yue',
		en: 'en',
		ja: 'jp',
		ko: 'kor',
		fr: 'fra',
		es: 'spa',
		ru: 'ru',
		de: 'de',
		it: 'it',
		tr: 'tr',
		pt_pt: 'pt',
		pt_br: 'pot',
		vi: 'vie',
		id: 'id',
		th: 'th',
		ms: 'may',
		ar: 'ar',
		hi: 'hi',
		km: 'hkm',
		nb_no: 'nob',
		nn_no: 'nno',
		fa: 'per',
		sv: 'swe',
		pl: 'pl',
		nl: 'nl'
	},
	ui: [
		{ name: 'url', label: '接口地址', type: 'input', default: DefaultURL, explain: '百度翻译Api接口地址，若无必要请勿修改' },
		{ name: 'appid', label: 'App ID', type: 'input' },
		{ name: 'secret', label: 'Secret', type: 'password' }
	],
	async Detect(_params: Record<string, string>, text: string): Promise<string> {
		let res = await fetch('https://fanyi.baidu.com/langdetect', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: { query: text }
		})
		if (res.ok) {
			let result = res.data as Record<string, string>
			if (result?.lan) {
				return result.lan || 'en'
			}
		}
		return 'en'
	},
	async Translate(params: Record<string, string>, text: string, from: string, to: string): Promise<string> {
		let { url, appid, secret } = params
		if (!appid || !secret) throw new Error('App ID and Secret is required')
		if (!url) url = DefaultURL

		const salt = Date.now() + ''
		let res: IResponse<any>;
		try {
			res = await fetch<any>(url, {
				method: 'GET',
				query: {
					q: text,
					from,
					to,
					appid,
					salt,
					sign: MD5(appid + text + salt + secret).toString()
				}
			})
		} catch (e) {
			throw new Error('Fetch Error:' + e.message)
		}
		if (!res.ok) {
			throw new Error(`Http Request Error\nHttp Status: ${ res.status }\n${ JSON.stringify(res.data) }`)
		}
		const { trans_result } = res.data as Record<string, any>
		if (trans_result?.length) {
			return trans_result.map((x: { dst: string }) => x.dst).join('\n').trim()
		}
		throw new Error(JSON.stringify(res.data))
	}
}
