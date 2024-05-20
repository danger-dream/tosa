import { fetch } from '../../Background'
import CryptoJS from 'crypto-js'
import { IBaseTransService, IDictResult } from '../../types'

function S4(): string {
	return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
}

function truncate(q: string): string {
	const len = q.length
	if (len <= 20) return q
	return q.substring(0, 10) + len + q.substring(len - 10, len)
}

const DefaultURL = 'http://openapi.youdao.com/api'
export const Youdao: IBaseTransService = {
	name: 'youdao',
	label: '有道翻译',
	icon: '/icon/youdao.svg',
	helpLink: 'https://ai.youdao.com/DOCSIRMA/html/trans/api/wbfy/index.html',
	languages: {
		auto: 'auto',
		zh_cn: 'zh-CHS',
		zh_tw: 'zh-CHT',
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
		pt_br: 'pt',
		vi: 'vie',
		id: 'id',
		th: 'th',
		ms: 'may',
		ar: 'ar',
		hi: 'hi',
		mn_mo: 'mn',
		km: 'km',
		nb_no: 'no',
		nn_no: 'no',
		fa: 'fa',
		sv: 'sv',
		pl: 'pl',
		nl: 'nl'
	},
	ui: [
		{ name: 'url', label: '连接地址', type: 'input', default: DefaultURL, explain: '有道翻译Api接口地址，若无必要请勿修改' },
		{ name: 'appKey', label: 'App ID', type: 'input', default: '', explain: '' },
		{ name: 'key', label: 'Key', type: 'password', default: '', explain: '' }
	],
	async Translate(params: Record<string, any>, text: string, from: string, to: string): Promise<string> {
		let { url, appKey, key } = params
		if (!appKey || !key) throw 'App ID and Key is required'
		if (!url) url = DefaultURL

		const curtime = String(Math.round(Date.now() / 1000))
		const salt = S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4()
		const sign = CryptoJS.SHA256(appKey + truncate(text) + salt + curtime + key).toString()
		let res = await fetch<any>(url, {
			method: 'GET',
			query: {
				q: text,
				from: from,
				to: to,
				appKey: appKey as string,
				salt,
				sign,
				signType: 'v3',
				curtime: curtime,
				ext: 'mp3'
			}
		})
		if (res.ok) {
			let result = res.data
			if (result['isWord']) {
				return result['translation'].join('\n')
			} else {
				if (result['translation']) {
					let target = ''
					for (let i of result['translation']) {
						target += i + '\n'
					}
					return target.trim()
				} else {
					throw JSON.stringify(result)
				}
			}
		} else {
			throw `Http Request Error\nHttp Status: ${ res.status }\n${ JSON.stringify(res.data) }`
		}
	},
	async Dict(params: Record<string, any>, text: string, from: string, to: string): Promise<IDictResult> {
		let { url, appKey, key } = params
		if (!appKey || !key) throw 'App ID and Key is required'
		if (!url) url = DefaultURL

		const curtime = String(Math.round(Date.now() / 1000))
		const salt = S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4()
		const sign = CryptoJS.SHA256(appKey + truncate(text) + salt + curtime + key).toString()
		let res = await fetch<any>(url, {
			method: 'GET',
			query: {
				q: text,
				from: from,
				to: to,
				appKey: appKey as string,
				salt,
				sign,
				signType: 'v3',
				curtime: curtime,
				ext: 'mp3'
			}
		})
		if (res.ok) {
			let result = res.data
			let target = {
				text: '',
				pronunciations: [],
				explanations: [],
				wfs: []
			} as IDictResult
			if (result['isWord']) {
				target.text = result['translation'].join('\n')
				let basic = result['basic']
				if (basic['us-phonetic']) {
					target.pronunciations.push({ region: '美', symbol: basic['us-phonetic'], voice: basic['us-speech'] })
				}
				if (basic['uk-phonetic']) {
					target.pronunciations.push({ region: '英', symbol: basic['uk-phonetic'], voice: basic['uk-speech'] })
				}
				if (basic['phonetic'] && target.pronunciations.length === 0) {
					target.pronunciations.push({ region: '', symbol: basic['phonetic'], voice: '' })
				}
				for (let i of basic['explains']) {
					let trait = ''
					if (i.split(' ')[0].endsWith('.')) {
						trait = i.split(' ')[0]
					}
					let explains = i.replace(trait, '').trim()
					target.explanations.push({ trait, explains: explains.split('；') })
				}
				if (basic['wfs']) {
					target.wfs = basic['wfs'].map((x: { wf: { name: string, value: string } }) => {
						return { name: x.wf.name, value: x.wf.value }
					})
				}
				if (result['web']) {
					target.web = result['web'].map((x: { key: string, value: string }) => {
						return { name: x.key, list: x.value }
					})
				}
				return target
			} else {
				if (result['translation']) {
					for (let i of result['translation']) {
						target.text += i + '\n'
					}
					return target
				} else {
					throw JSON.stringify(result)
				}
			}
		} else {
			throw `Http Request Error\nHttp Status: ${ res.status }\n${ JSON.stringify(res.data) }`
		}
	}
}
