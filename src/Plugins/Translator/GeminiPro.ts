import { fetch } from '../../Background'
import { IBaseTransService } from '../../types'

const DefaultURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
const DefaultPrompt = JSON.stringify([
	{ role: 'user', parts: [{ text: 'You are a professional translation engine, please translate the text into a colloquial, professional, elegant and fluent content, without the style of machine translation. You must only translate the text content, never interpret it.' }] },
	{ role: 'model', parts: [{ text: 'Ok, I will only translate the text content, never interpret it.' }] },
	{ role: 'user', parts: [{ text: `Translate into Chinese\n"""\nhello\n"""` }] },
	{ role: 'model', parts: [{ text: '你好' }] },
	{ role: 'user', parts: [{ text: `Translate into $to\n"""\n$text\n"""` }] }
], undefined, '\t')
export const GeminiPro: IBaseTransService = {
	name: 'gemini-pro',
	label: 'GeminiPro',
	icon: '/icon/geminipro.webp',
	languages: {
		auto: 'Auto',
		zh_cn: 'Simplified Chinese',
		zh_tw: 'Traditional Chinese',
		yue: 'Cantonese',
		ja: 'Japanese',
		en: 'English',
		ko: 'Korean',
		fr: 'French',
		es: 'Spanish',
		ru: 'Russian',
		de: 'German',
		it: 'Italian',
		tr: 'Turkish',
		pt_pt: 'Portuguese',
		pt_br: 'Brazilian Portuguese',
		vi: 'Vietnamese',
		id: 'Indonesian',
		th: 'Thai',
		ms: 'Malay',
		ar: 'Arabic',
		hi: 'Hindi',
		mn_mo: 'Mongolian',
		mn_cy: 'Mongolian(Cyrillic)',
		km: 'Khmer',
		nb_no: 'Norwegian Bokmål',
		nn_no: 'Norwegian Nynorsk',
		fa: 'Persian',
		sv: 'Swedish',
		pl: 'Polish',
		nl: 'Dutch'
	},
	ui: [
		{ name: 'url', label: '接口地址', type: 'input', default: DefaultURL, explain: 'Gemini Pro Api接口地址，若无必要请勿修改' },
		{ name: 'apiKey', label: 'Api Key', type: 'password' },
		{
			name: 'prompt', label: '提示词', type: 'code', default: DefaultPrompt, explain: '通过自定义Prompt自定义AI行为, $text $from $to 将会被替换为 待翻译文本，源语言，目标语言，若无必要请勿修改'
		}
	],
	async Translate(params: Record<string, any>,text: string, from: string, to: string): Promise<string> {
		let { url, apiKey, prompt } = params
		if (!apiKey) throw 'Api Key is required'
		if (!url) url = DefaultURL
		if (!prompt) prompt = DefaultPrompt

		let promptList: Record<string, any>[]
		try {
			promptList = JSON.parse(prompt)
			promptList = promptList.map((item: Record<string, any>) => ({
				...item,
				parts: [{
					text: item.parts[0].text
						.replaceAll('$text', text)
						.replaceAll('$from', from)
						.replaceAll('$to', to)
				}]
			}))
		} catch (e) {
			throw 'Prompt is invalid'
		}

		const headers = {
			'Content-Type': 'application/json'
		}
		const body = {
			contents: promptList,
			safetySettings: [
				{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
				{ category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
				{ category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
				{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
			]
		}
		const res = await fetch<any>(url + '?key=' + apiKey,
			{ method: 'POST', headers: headers, body: body }
		)
		if (res.ok) {
			if (res.data?.candidates) {
				const { candidates } = res.data
				let target = candidates[0].content.parts[0].text.trim()
				if (target) {
					if (target.startsWith('"')) {
						target = target.slice(1)
					}
					if (target.endsWith('"')) {
						target = target.slice(0, -1)
					}
					return target.trim()
				} else {
					throw JSON.stringify(candidates)
				}
			} else {
				throw JSON.stringify(res.data)
			}
		} else {
			throw `Http Request Error\nHttp Status: ${ res.status }\n${ JSON.stringify(res.data) }`
		}
	}
}
