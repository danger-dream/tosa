import { ElInput } from 'element-plus'
import { JSONPath } from 'jsonpath-plus'
import {fetch, IRequestOptions, shellOpen} from '../../Background'
import { IBaseOcrService } from '../../types'
import 'element-plus/es/components/input/style/css'


const DefaultData = JSON.stringify({
	method: 'POST',
	headers: {},
	body: {},
	query: {},
	timeout: 5000
}, undefined, '\t')
export const Custom: IBaseOcrService = {
	name: 'custom',
	label: '自定义接口',
	icon: '/icon/custom.svg',
	explain: '用于调用自己部署的OCR接口',
	ui: [
		{ name: 'url', label: '连接地址', type: 'input', default: '', explain: 'Api接口地址' },
		{
			name: 'data', label: '请求参数', type: 'code', default: DefaultData,
			explain: 'method默认为POST，超时时间默认为5秒，内容中的"{image}"将被替换为图片Base64编码，其他内容将被直接发送到接口。'
		},
		{
			name: 'bodyType', label: '数据类型', type: 'select',
			dict: [
				{ label: '文本', value: 'text' },
				{ label: 'JSON', value: 'json' },
				{ label: '表单', value: 'form' }
			],
			default: 'json',
			explain: '请求Body的数据类型'
		},
		{
			name: 'resType', label: '结果类型', type: 'select',
			dict: [
				{ label: '文本', value: 'text' },
				{ label: 'JSON', value: 'json' }
			],
			default: 'text',
			explain: '若结果类型为json，请设置JSON Path，否则无法提取识别结果。若为文本则直接使用调用结果'
		},
		{
			name: 'jsonpath', label: 'JSON Path', type: 'input', default: '$',
			components(params) {
				return (<div class="flex flex-col">
					<ElInput v-model={ params['jsonpath'] } placeholder="请输入JSON Path" />
					<div class="item-tip">用于从JSON类型的结果中提取识别结果。</div>
					<div class="flex mt-1">
						<a onClick={ () => shellOpen('https://goessner.net/articles/JsonPath/') }
							href="#" class="text-[var(--primary)]">
							JSONPath文档
						</a>
						<a onClick={ () => shellOpen('https://jsonpath.com/') }
							href="#" class="text-[var(--primary)] ml-2">
							在线调试
						</a>
					</div>
				</div>)
			}
		}

	],
	async Ocr(params, img): Promise<string> {
		let { url, data, bodyType, resType, jsonpath } = params
		if (!url) throw new Error('连接地址不能为空')
		if (!data) data = DefaultData
		if (!bodyType) bodyType = 'json'
		if (!resType) resType = 'text'
		if (!jsonpath) jsonpath = '$'

		const startIndex = data.indexOf('{image}')
		if (startIndex === -1) {
			throw new Error('请求参数中不包含"{image}"')
		}
		let leftQuote = data.substring(startIndex, startIndex - 1)
		if (leftQuote !== "'" && leftQuote !== '"') {
			throw new Error('请求参数{image}必须使用引号包裹')
		}
		let reqData: {
			method?: string,
			headers?: Record<string, string>,
			body?: Record<string, string>,
			query?: Record<string, string>,
			timeout?: number
		}
		try {
			let json = data.replace('{image}', img)
			reqData = JSON.parse(json)
		} catch (e) {
			throw new Error('请求参数解析失败: ' + e.message)
		}
		const options: IRequestOptions = {
			method: reqData.method ? reqData.method.toUpperCase() as any : 'POST',
			timeout: reqData.timeout || 5000
		}
		if (Object.keys(reqData.headers || {}).length) {
			options.headers = reqData.headers
		}
		if (Object.keys(reqData.query || {}).length) {
			options.query = reqData.query
		}
		if (Object.keys(reqData.body || {}).length) {
			const type = bodyType || 'json'
			switch (type) {
				case 'text':
					options.text = JSON.stringify(reqData.body)
					break
				case 'json':
					options.body = reqData.body
					break
				case 'form':
					options.form = reqData.body
					break
			}
		}
		options.responseType = 2
		const res = await fetch(url, options)
		if (!res.ok) {
			throw new Error(`Http Request Error\nHttp Status: ${ res.status }\n${ res.data }`)
		}
		if (resType === 'text') {
			return typeof res.data === 'string'
				? res.data
				: JSON.stringify(res.data)
		}
		let resultJson: any
		try {
			resultJson = JSON.parse((res.data + '').replace(/(\r\n|\n|\r)/gm, ''))
		} catch (e) {
			throw new Error('解析JSON结果错误: ' + e.message)
		}
		try {
			const result = JSONPath({ path: jsonpath, json: resultJson, resultType: 'value' })
			if (result.length) {
				return result.join('\n')
			}
			throw new Error('未匹配到结果')
		} catch (e) {
			throw new Error('提取JSON结果错误: ' + e.message)
		}
	}
}
