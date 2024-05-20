import { fetch } from '../../Background'
import { IBaseTransService } from '../../types'

const DefaultURL = 'https://api.openai.com/v1/chat/completions'
const DefaultModel = 'gpt-3.5-turbo'
const DefaultPrompt = JSON.stringify([
	{ role: 'system', content: 'You are a professional translation engine, please translate the text into a colloquial, professional, elegant and fluent content, without the style of machine translation. You must only translate the text content, never interpret it.' },
	{ role: 'user', content: `Translate into $to:\n"""\n$text\n"""` }
], undefined, '\t')

export const OpenAI: IBaseTransService = {
	name: 'openai',
	label: 'OpenAI',
	icon: '/icon/openai.svg',
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
	ui:  [
		{ name: 'url', label: '接口地址', type: 'input', default: DefaultURL, explain: 'OpenAI Api接口地址' },
		{ name: 'apiKey', label: 'Api Key', type: 'password' },
		{ name: 'model', label: '模型', type: 'input', default: DefaultModel },
		{ name: 'prompt', label: '提示词', type: 'code', default: DefaultPrompt }
	],
	async Translate(params: Record<string, any>, text: string, from: string, to: string): Promise<string> {
		let { url, apiKey, model, prompt } = params
		if (!apiKey) throw new Error('Api Key is required')
		if (!url) url = DefaultURL
		if (!model) model = DefaultModel
		if (!prompt) prompt = DefaultPrompt

		let promptList: Record<string, any>[]
		try {
			promptList = JSON.parse(prompt).map((item: Record<string, any>) => {
				return {
					...item,
					content: item.content
						.replaceAll('$text', text)
						.replaceAll('$from', from)
						.replaceAll('$to', to)
				}
			})
		} catch {
			throw new Error('Prompt is invalid')
		}

		let res = await fetch<any>(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${ apiKey }`
			},
			body: {
				model,
				temperature: 0,
				stream: false,
				top_p: 1,
				frequency_penalty: 1,
				presence_penalty: 1,
				messages: promptList
			}
		})
		if (res.ok) {
			let result = res.data
			const { choices } = result as any
			if (choices) {
				let target = choices[0].message.content.trim()
				if (target) {
					if (target.startsWith('"')) {
						target = target.slice(1)
					}
					if (target.endsWith('"')) {
						target = target.slice(0, -1)
					}
					return target.trim()
				} else {
					throw JSON.stringify(choices)
				}
			} else {
				throw JSON.stringify(result)
			}
		} else {
			throw `Http Request Error\nHttp Status: ${ res.status }\n${ JSON.stringify(res.data) }`
		}
	}
}
