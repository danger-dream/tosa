import { fetch } from '../../Background'
import { IBaseOcrService } from '../../types'
import hmacSHA256 from 'crypto-js/hmac-sha256'
import hashSHA256 from 'crypto-js/sha256'
import hex from 'crypto-js/enc-hex'

const DefaultURL = 'ocr.tencentcloudapi.com'
const DefaultRegion = 'ap-guangzhou'
const DefaultType = 'GeneralAccurateOCR'
export const Tencent: IBaseOcrService = {
	name: 'tencent',
	label: '腾讯云-通用印刷体识别',
	icon: '/icon/tencent_cloud.png',
	explain: '',
	helpLink: 'https://cloud.tencent.com/document/product/866/33526',
	ui: [
		{ name: 'url', label: '连接地址', type: 'input', default: DefaultURL, explain: '腾讯Api接口地址，若无必要请勿修改' },
		{
			name: 'region', label: '接口区域', type: 'select', default: DefaultRegion,
			dict: [
				{ label: '华北地区（北京）', value: 'ap-beijing' },
				{ label: '华东地区（上海）', value: 'ap-shanghai' },
				{ label: '华南地区（广州）', value: 'ap-guangzhou' },
				{ label: '港澳台地区（中国香港）', value: 'ap-hongkong' },
				{ label: '亚太东南（曼谷）', value: 'ap-bangkok' },
				{ label: '北美地区（多伦多）', value: 'ap-toronto' }
			]
		},
		{ name: 'secretId', label: 'Secret ID', type: 'input' },
		{ name: 'secretKey', label: 'Secret Key', type: 'password' },
		{
			name: 'type',
			label: '类型',
			type: 'select',
			dict: [
				{ label: '标准版', value: 'GeneralBasicOCR' },
				{ label: '高精度版', value: 'GeneralAccurateOCR' }
			],
			default: DefaultType,
			explain: '高精度版QPS较低，若使用频繁请选择标准版。'
		}
	],
	async Ocr(params, img): Promise<string> {
		let { url: endpoint, region, secretId, secretKey, type: action } = params
		if (!secretId || !secretKey) throw new Error('SecretId 和 SecretKey 不能为空')
		if (!endpoint) endpoint = DefaultURL
		if (!region) region = DefaultRegion
		if (!action) action = DefaultType

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
		const service = 'ocr'
		const version = '2018-11-19'
		const timestamp = Math.ceil(Date.now() / 1000)
		// const timestamp = 1551113065
		//时间处理, 获取世界时间日期
		const date = getDate(timestamp)

		// ************* 步骤 1：拼接规范请求串 *************
		const payload = JSON.stringify({ ImageBase64: img })
		const hashedRequestPayload = getHash(payload)
		const httpRequestMethod = 'POST'
		const canonicalUri = '/'
		const canonicalQueryString = ''
		const canonicalHeaders = 'content-type:application/json; charset=utf-8\nhost:' + endpoint + '\nx-tc-action:' + action.toLowerCase() + '\n'
		const signedHeaders = 'content-type;host;x-tc-action'

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
		const kDate = sha256(date, 'TC3' + secretKey)
		const kService = sha256(service, kDate)
		const kSigning = sha256('tc3_request', kService)
		const signature = hex.stringify(sha256(stringToSign, kSigning))

		// ************* 步骤 4：拼接 Authorization *************
		const authorization =
			algorithm + ' ' +
			'Credential=' + secretId + '/' + credentialScope + ', ' +
			'SignedHeaders=' + signedHeaders + ', ' +
			'Signature=' + signature

		let res = await fetch('https://' + endpoint, {
			method: 'POST',
			headers: {
				Authorization: authorization,
				'content-type': 'application/json; charset=utf-8',
				Host: endpoint,
				'X-TC-Action': action,
				'X-TC-Timestamp': timestamp.toString(),
				'X-TC-Version': version,
				'X-TC-Region': region
			},
			text: payload
		})
		if (!res.ok) {
			throw `Http Request Error\nHttp Status: ${ res.status }\n${ JSON.stringify(res.data) }`
		}
		const response = (res.data as any)['Response'] as Record<string, any>
		if (response['Error']) {
			const ErrorData = response['Error']
			handlerError(ErrorData['Code'], ErrorData['Message'])
		}
		if (response['TextDetections']) {
			let target = ''
			for (let i of response['TextDetections']) {
				target += i['DetectedText'] + '\n'
			}
			return target.trim()
		} else {
			throw new Error(JSON.stringify(response))
		}
	}
}

function handlerError(code: string, msg: string) {
	switch (code) {
		case 'AuthFailure.SignatureExpire':
		case 'AuthFailure.SignatureFailure':
		case 'AuthFailure.TokenFailure':
		case 'UnauthorizedOperation':
			throw new Error('密钥已失效')
		case 'ActionOffline':
			throw new Error('接口已下线')
		case 'AuthFailure.InvalidSecretId':
		case 'AuthFailure.SecretIdNotFound':
			throw new Error('密钥非法')
		case 'AuthFailure.UnauthorizedOperation':
			throw new Error('请求未授权')
		case 'IpInBlacklist':
			throw new Error('IP在黑名单中')
		case 'IpNotInWhitelist':
			throw new Error('IP地址不在白名单中')
		case 'LimitExceeded':
			throw new Error('超过配额限制')
		case 'RequestLimitExceeded':
			throw new Error('请求次数超过限制')
		case 'RequestLimitExceeded.GlobalRegionUinLimitExceeded':
			throw new Error('主账号超过频率限制')
		case 'RequestLimitExceeded.IPLimitExceeded':
			throw new Error('IP限频')
		case 'RequestLimitExceeded.UinLimitExceeded':
			throw new Error('主账号限频')
		case 'RequestSizeLimitExceeded':
			throw new Error('请求包超过限制大小')
		case 'ResourceInsufficient':
			throw new Error('资源不足')
		case 'ResourceNotFound':
			throw new Error('资源不存在')
		case 'ResourceUnavailable':
			throw new Error('资源不可用')
		case 'ServiceUnavailable':
			throw new Error('当前服务暂时不可用')
		case 'FailedOperation.ArrearsError':
		case 'ResourceUnavailable.InArrears':
			throw new Error('账号已欠费')
		case  'ResourcesSoldOut.ChargeStatusException':
			throw new Error('计费状态异常')
		case  'FailedOperation.CountLimitError':
			throw new Error('今日次数达到限制')
		case  'FailedOperation.ImageBlur':
			throw new Error('图片模糊')
		case  'FailedOperation.ImageDecodeFailed':
			throw new Error('图片解码失败')
		case  'FailedOperation.ImageNoText':
			throw new Error('图片中未检测到文本')
		case  'FailedOperation.ImageSizeTooLarge':
			throw new Error('图片尺寸过大')
		case  'FailedOperation.OcrFailed':
			throw new Error('腾讯云接口结果：OCR识别失败')
		case  'FailedOperation.UnOpenError':
			throw new Error('服务未开通')
		default:
			throw new Error(msg)
	}
}