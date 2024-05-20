import { fetch, shellOpen } from '../../Background'
import hmacSHA256 from 'crypto-js/hmac-sha256'
import hashSHA256 from 'crypto-js/sha256'
import hex from 'crypto-js/enc-hex'
import { IBaseTransService } from '../../types'
import { ElInput } from 'element-plus'
import 'element-plus/es/components/input/style/css'

const DefaultURL = 'tmt.tencentcloudapi.com'
const DefaultRegion = 'ap-chengdu'
export const Tencent: IBaseTransService = {
	name: 'tencent',
	label: '腾讯翻译',
	icon: '/icon/tencent.svg',
	helpLink: 'https://cloud.tencent.com/document/api/551/15619',
	languages: {
		auto: 'auto',
		zh_cn: 'zh',
		zh_tw: 'zh-TW',
		en: 'en',
		ja: 'ja',
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
		hi: 'hi'
	},
	ui: [
		{ name: 'url', label: '连接地址', type: 'input', default: DefaultURL, explain: '腾讯Api接口地址，若无必要请勿修改' },
		{
			name: 'region', label: '接口区域', type: 'input', default: DefaultRegion,
			components: (params: Record<string, any>) => <div class="w-full">
				<ElInput v-model={ params['region'] } class="w-full mb-2"></ElInput>
				<a onClick={ () => shellOpen('https://www.tencentcloud.com/zh/document/product/213/6091') }
					href="#" class="text-[var(--primary)]">
					查看可用区域
				</a>
			</div>
		},
		{ name: 'secretId', label: 'Secret ID', type: 'input' },
		{ name: 'secretKey', label: 'Secret Key', type: 'password' }
	],
	async Detect(_params: Record<string, any>, text: string): Promise<string> {
		let res = await fetch<Record<string, any>>('https://fanyi.qq.com/api/translate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: { sourceText: text }
		})
		if (res.ok) {
			let result = res.data
			if (result.translate && result.translate.source) {
				return result.translate.source
			}
		}
		return 'en'
	},
	async Translate(params: Record<string, any>, text: string, from: string, to: string): Promise<string> {
		let { url, region, secretId: secret_id, secretKey: secret_key } = params
		if (!secret_id || !secret_key) throw 'SecretId and SecretKey is required'
		if (!url) url = DefaultURL
		if (!region) region = DefaultRegion

		function sha256(message: any, secret: any = '') {
			return hmacSHA256(message, secret)
		}

		function getHash(message: any) {
			return hashSHA256(message).toString()
		}

		function getDate(timestamp: any) {
			const date = new Date(timestamp * 1000)
			const year = date.getUTCFullYear()
			const month = ('0' + (date.getUTCMonth() + 1)).slice(-2)
			const day = ('0' + date.getUTCDate()).slice(-2)
			return `${ year }-${ month }-${ day }`
		}

		const endpoint = url
		const service = 'tmt'
		const action = 'TextTranslate'
		const version = '2018-03-21'
		const timestamp = Math.ceil(Date.now() / 1000)
		// const timestamp = 1551113065
		//时间处理, 获取世界时间日期
		const date = getDate(timestamp)

		// ************* 步骤 1：拼接规范请求串 *************
		const body = {
			SourceText: text,
			Source: from,
			Target: to,
			ProjectId: 0
		}
		const payload = JSON.stringify(body)
		// const payload = "{\"Limit\": 1, \"Filters\": [{\"Values\": [\"\\u672a\\u547d\\u540d\"], \"Name\": \"instance-name\"}]}"

		const hashedRequestPayload = getHash(payload)
		const httpRequestMethod = 'POST'
		const canonicalUri = '/'
		const canonicalQueryString = ''
		const canonicalHeaders = 'content-type:application/json\n' + 'host:' + endpoint + '\n'
		// + "x-tc-action:" + action.toLowerCase() + "\n"
		const signedHeaders = 'content-type;host'

		const canonicalRequest =
			httpRequestMethod +
			'\n' +
			canonicalUri +
			'\n' +
			canonicalQueryString +
			'\n' +
			canonicalHeaders +
			'\n' +
			signedHeaders +
			'\n' +
			hashedRequestPayload

		// ************* 步骤 2：拼接待签名字符串 *************
		const algorithm = 'TC3-HMAC-SHA256'
		const hashedCanonicalRequest = getHash(canonicalRequest)
		const credentialScope = date + '/' + service + '/' + 'tc3_request'
		const stringToSign = algorithm + '\n' + timestamp + '\n' + credentialScope + '\n' + hashedCanonicalRequest

		// ************* 步骤 3：计算签名 *************
		const kDate = sha256(date, 'TC3' + secret_key)
		const kService = sha256(service, kDate)
		const kSigning = sha256('tc3_request', kService)
		const signature = hex.stringify(sha256(stringToSign, kSigning))

		// ************* 步骤 4：拼接 Authorization *************
		const authorization =
			algorithm +
			' ' +
			'Credential=' +
			secret_id +
			'/' +
			credentialScope +
			', ' +
			'SignedHeaders=' +
			signedHeaders +
			', ' +
			'Signature=' +
			signature

		let res = await fetch<any>('https://' + endpoint, {
			method: 'POST',
			headers: {
				Authorization: authorization,
				'content-type': 'application/json',
				Host: endpoint,
				'X-TC-Action': action,
				'X-TC-Timestamp': timestamp.toString(),
				'X-TC-Version': version,
				'X-TC-Region': region
			},
			text: payload
		})
		if (res.ok) {
			let { Response } = res.data
			if (Response && Response['TargetText'] && Response['Source']) {
				return Response['TargetText'].trim()
			} else {
				throw JSON.stringify(res.data)
			}
		} else {
			throw `Http Request Error\nHttp Status: ${ res.status }\n${ JSON.stringify(res.data) }`
		}
	}
}
