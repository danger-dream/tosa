import { fetch } from '../../Background'
import { MD5 } from 'crypto-js'
import { IBaseOcrService } from '../../types'

interface IToken {
	token: string
	timestamp: number
	expires_in: number
}

//  增加token缓存，对于长期运行的情况更优化，减少token获取次数
const tokenMemCache: Record<string, IToken> = {}
const DefaultURL = 'https://aip.baidubce.com'
const DefaultType = 'general_basic'

const dict = [
	{ label: '标准版', value: 'general_basic'},
	{ label: '标准含坐标版', value: 'general'},
	{ label: '高精度版', value: 'accurate_basic'},
	{ label: '高精度含位置版', value: 'accurate' }
]
export const Baidu: IBaseOcrService = {
	name: 'baidu',
	label: '百度云-通用文字识别',
	icon: '/icon/baidu.svg',
	explain: '使用『百度云平台』接口，与文本翻译中的『百度翻译』接口无法使用同样的Sectet，需单独申请，申请后记得领取每月免费资源。',
	helpLink: 'https://cloud.baidu.com/doc/OCR/index.html',
	ui: [
		{ name: 'url', label: '接口地址', type: 'input', default: DefaultURL, explain: '百度云Api接口地址，若无必要请勿修改' },
		{ name: 'client_id', label: 'Client ID', type: 'input' },
		{ name: 'client_secret', label: 'Secret', type: 'password' },
		{ name: 'type', label: '类型', type: 'select', dict, default: DefaultType, explain: '坐标版并无特殊效果，' }
	],
	async Ocr(params, img, retry_count): Promise<string> {
		let { url: baseUrl, client_id, client_secret, type } = params
		if (!client_id || !client_secret) throw new Error('Client ID 和 Secret 不可为空')
		if (!dict.find(x => x.value === type)) throw new Error('类型无效')
		if (!baseUrl) baseUrl = DefaultURL


		const hash = MD5(baseUrl + '.' + client_id + '.' + client_secret).toString()
		let access_token = ''
		if (tokenMemCache[hash]) {
			const record = tokenMemCache[hash]
			if (record.timestamp + record.expires_in > Date.now()) {
				delete tokenMemCache[hash]
			} else {
				access_token = record.token
			}
		}
		if (!access_token) {
			const token_url = `${ baseUrl }/oauth/2.0/token`
			const token_res = await fetch(token_url, {
				method: 'POST',
				query: {
					grant_type: 'client_credentials',
					client_id,
					client_secret
				},
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				}
			})
			if (!token_res.ok) {
				throw `Http Request Error\nHttp Status: ${ token_res.status }\n${ JSON.stringify(token_res.data) }`
			}
			const data = token_res.data as any
			if (!data.access_token) throw new Error('Get Access Token Failed!')
			const scope = `brain_ocr_${ type }`
			if (data.scope && !data.scope.includes(scope)) {
				throw new Error(`Access Token Not supported ${ dict.find(x => x.value === type)!.label } Api`)
			}
			tokenMemCache[hash] = {
				token: data.access_token,
				timestamp: Date.now(),
				expires_in: data.expires_in
			}
			access_token = data.access_token
		}

		const url = `${ baseUrl }/rest/2.0/ocr/v1/${ type }`
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			query: { access_token },
			form: { detect_direction: 'false', image: img }
		})
		if (!res.ok) {
			throw `Http Request Error\nHttp Status: ${ res.status }\n${ JSON.stringify(res.data) }`
		}
		const result = res.data as Record<string, any>
		if (result['words_result']) {
			let target = ''
			for (let i of result['words_result']) {
				target += i['words'] + '\n'
			}
			return target.trim()
		} else {
			// token 无效或过期
			const error_code = result['error_code'] as number
			if (error_code === 17) {
				throw new Error('单日请求量超过可用限额')
			}
			if (error_code === 18) {
				throw new Error('超过并发限制，请稍后重试')
			}
			if (error_code === 19 || error_code === 216604) {
				throw new Error('请求总量超过限额')
			}
			if (error_code === 216102) {
				throw new Error('不支持该类型的服务')
			}
			if (error_code === 110 || error_code === 111) {
				delete tokenMemCache[hash]
				if (retry_count > 0) {
					throw new Error('Token无效或已过期且超过重试次数')
				}
				return Baidu.Ocr(params, img, retry_count + 1)
			}
			throw JSON.stringify(result)
		}
	}
}