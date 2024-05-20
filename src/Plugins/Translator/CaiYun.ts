import { fetch } from '../../Background'
import { IBaseTransService } from '../../types'

const DefaultURL = 'http://api.interpreter.caiyunai.com/v1/translator'
export const caiyun: IBaseTransService = {
	name: 'caiyun',
	label: '彩云小译',
	icon: '/icon/caiyun.svg',
	helpLink: 'https://open.caiyunapp.com/%E4%BA%94%E5%88%86%E9%92%9F%E5%AD%A6%E4%BC%9A%E5%BD%A9%E4%BA%91%E5%B0%8F%E8%AF%91_API',
	languages: {
		auto: 'auto',
		zh_cn: 'zh',
		zh_tw: 'zh',
		en: 'en',
		ja: 'ja'
	},
	ui: [
		{
			name: 'url',
			label: '连接地址',
			type: 'input',
			default: DefaultURL,
			explain: '彩云小译Api接口地址，若无必要请勿修改'
		},
		{ name: 'token', label: 'Token', type: 'password' }
	],

	async Translate(params: Record<string, any>, text: string, from: string, to: string): Promise<string> {
		let { url, token } = params
		if (!token) throw 'Token is required'
		if (!url) url = DefaultURL


		const res = await fetch<any>(url, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'x-authorization': 'token ' + token
			},
			body: {
				source: [text], trans_type: `${from}2${to}`,
				request_id: 'demo', detect: true
			}
		})
		if (res.ok) {
			let result = res.data
			const { target } = result
			if (target[0]) {
				return target[0]
			} else {
				throw JSON.stringify(result.trim())
			}
		} else {
			throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`
		}
	}
}
