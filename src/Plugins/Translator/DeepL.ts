import { fetch } from '../../Background'
import { IBaseTransService } from '../../types'


export const DeepL: IBaseTransService = {
	name: 'deepl',
	label: 'DeepL',
	icon: '/icon/deepl.svg',
	languages: {
		auto: 'auto',
		zh_cn: 'ZH',
		zh_tw: 'ZH',
		ja: 'JA',
		en: 'EN',
		ko: 'KO',
		fr: 'FR',
		es: 'ES',
		ru: 'RU',
		de: 'DE',
		it: 'IT',
		tr: 'TR',
		pt_pt: 'PT-PT',
		pt_br: 'PT-BR',
		id: 'ID',
		sv: 'SV',
		pl: 'PL',
		nl: 'NL'
	},
	ui: [
		{ name: 'type', label: '接口类型', type: 'select', dict: [{ label: '免费版', value: 'free' }, { label: 'Api接口', value: 'api' }, { label: 'Deeplx', value: 'deeplx' }], default: 'free' },
		{ name: 'authKey', label: 'Auth Key', type: 'password', explain: '为Api时必填' },
		{ name: 'url', label: 'DeepLX地址', type: 'input', explain: '为Deeplx时必填' }
	],
	async Translate(params: Record<string, any>, text: string, from: string, to: string): Promise<string> {
		const { type, authKey, url } = params
		if (type === 'api') {
			if (!authKey) {
				throw new Error('Auth Key is required')
			}
			return translate_by_key(text, from, to, authKey)
		} else if (type === 'deeplx') {
			if (!url) {
				throw new Error('DeepLX URL is required')
			}
			return translate_by_deeplx(text, from, to, url)
		}
		return translate_by_free(text, from, to)
	}

}

async function translate_by_free(text: string, from: string, to: string) {
	const url = 'https://www2.deepl.com/jsonrpc'
	const rand = getRandomNumber()
	const body = {
		jsonrpc: '2.0',
		method: 'LMT_handle_texts',
		params: {
			splitting: 'newlines',
			lang: {
				source_lang_user_selected: from !== 'auto' ? from.slice(0, 2) : 'auto',
				target_lang: to.slice(0, 2)
			},
			texts: [{ text, requestAlternatives: 3 }],
			timestamp: getTimeStamp(getICount(text))
		},
		id: rand
	}
	let body_str = JSON.stringify(body)
	if ((rand + 5) % 29 === 0 || (rand + 3) % 13 === 0) {
		body_str = body_str.replace('"method":"', '"method" : "')
	} else {
		body_str = body_str.replace('"method":"', '"method": "')
	}
	let res = await fetch<any>(url, {
		method: 'POST',
		text: body_str,
		headers: { 'Content-Type': 'application/json' }
	})
	if (res.ok) {
		let result = res.data
		if (result && result.result && result.result.texts) {
			return result.result.texts[0].text.trim()
		} else {
			throw JSON.stringify(result)
		}
	} else {
		if (res.data['error']) {
			throw `Status Code: ${ res.status }\n${ res.data['error']['message'] }`
		} else {
			throw `Http Request Error\nHttp Status: ${ res.status }\n${ JSON.stringify(res.data) }`
		}
	}
}

async function translate_by_deeplx(text: string, from: string, to: string, url: string) {
	let res = await fetch<any>(url, {
		method: 'POST',
		body: { source_lang: from, target_lang: to, text: text }
	})
	if (res.ok) {
		const result = res.data
		if (result['data']) {
			return result['data']
		} else {
			throw JSON.stringify(result)
		}
	} else {
		throw `Http Request Error\nHttp Status: ${ res.status }\n${ JSON.stringify(res.data) }`
	}
}

async function translate_by_key(text: string, from: string, to: string, key: string) {
	const headers = {
		'Content-Type': 'application/json',
		Authorization: `DeepL-Auth-Key ${ key }`
	}
	const body = { text: [text], target_lang: to }
	if (from !== 'auto') {
		body['source_lang'] = from
	}
	let url: string
	if (key.endsWith(':fx')) {
		url = 'https://api-free.deepl.com/v2/translate'
	} else if (key.endsWith(':dp')) {
		url = 'https://api.deepl-pro.com/v2/translate'
	} else {
		url = 'https://api.deepl.com/v2/translate'
	}
	const res = await fetch<any>(url, { method: 'POST', body: body, headers: headers })
	if (res.ok) {
		const result = res.data
		if (result['translations'] && result['translations'][0]) {
			return result['translations'][0].text.trim()
		} else {
			throw JSON.stringify(result)
		}
	} else {
		if (res.data['error']) {
			throw `Status Code: ${ res.status }\n${ res.data['error']['message'] }`
		} else {
			throw `Http Request Error\nHttp Status: ${ res.status }\n${ JSON.stringify(res.data) }`
		}
	}
}

function getTimeStamp(iCount: number) {
	const ts = Date.now()
	if (iCount !== 0) {
		iCount = iCount + 1
		return ts - (ts % iCount) + iCount
	} else {
		return ts
	}
}

function getICount(translate_text: string) {
	return translate_text.split('i').length - 1
}

function getRandomNumber() {
	const rand = Math.floor(Math.random() * 99999) + 100000
	return rand * 1000
}
