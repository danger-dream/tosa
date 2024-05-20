import { Baidu } from './Baidu.ts'
import { Tencent } from './Tencent.ts'
import { Custom } from './Custom.tsx'
import { IBaseOcrService, IOcrServiceConfig } from '../../types'
import { OcrType } from '../../Configuration.ts'
import { generateParams, racePromisesIgnoreErrors } from '../../Utils.ts'

export const plugins: IBaseOcrService[] = [Baidu, Tencent, Custom]

export async function ocr(
	config: IOcrServiceConfig,
	base64: string
): Promise<string> {
	let service = config.service
	if (!service) {
		service = config.service = plugins.find(x => x.name === config.name)
	}
	if (!service) {
		throw new Error('未找到图片识别服务')
	}
	if (!service.Ocr) {
		throw new Error('该服务不提供图片识别功能')
	}
	if (!base64) {
		throw new Error('图片数据为空')
	}
	const params = generateParams(
		service.ui,
		JSON.parse(JSON.stringify(config.params))
	)
	const time = config.timeout || 30 * 1000
	return new Promise<string>((resolve, reject) => {
		let isEnd = false
		let timeout:any
		function onEnd(err: Error | undefined, data?: string) {
			if (isEnd) return
			isEnd = true
			clearTimeout(timeout)
			if (err) {
				reject(new Error(`服务调用错误：${ err }`))
			} else {
				resolve(data!)
			}
		}
		timeout = setTimeout(() => onEnd(new Error(`服务调用超时：${ time }ms`)), time)
		service.Ocr!(params, base64, 0)
			.then((res) => onEnd(undefined, res))
			.catch(onEnd)
	})
}

export async function retryOcr(service: IOcrServiceConfig, retry: number, base64: string): Promise<string> {
	const retry_error_result: string[] = []
	retry = service.retry || retry || 1
	for (let i = 0; i < retry; i++) {
		try {
			return await ocr(service, base64)
		} catch (e) {
			retry_error_result.push(`第${ i + 1 }次调用发生错误: ${ e.message }`)
		}
	}
	throw new Error(retry_error_result.join('\n'))
}

export async function ocrRecognize(services: IOcrServiceConfig[], type: OcrType, retry: number, base64: string): Promise<string> {
	if (type === 'round') {
		// 轮询模式
		const error_result: string[] = []
		for (let i = 0; i < services.length; i++) {
			const service = services[i]
			try {
				return await retryOcr(service, retry, base64)
			} catch (e) {
				error_result.push(`服务 ${ service.label || service.service.label } 执行失败: ${ e }`)
			}
		}
		throw new Error('Ocr服务调用失败：\n' + error_result.join('\n'))
	} else if (type == 'concurrent') {
		// 并发模式
		try {
			const result = await racePromisesIgnoreErrors(
				services.map(service => retryOcr(service, retry, base64).then(
					res => ({ text: res, service }),
				))
			) as { service: IOcrServiceConfig, text: string }
			return result.text
		} catch (erros) {
			throw new Error('Ocr服务调用失败：\n' + erros.join('\n'))
		}
	}
	// 默认使用第一个服务
	const service = services[0]
	return retryOcr(service, retry, base64)
}
