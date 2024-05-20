import { invoke } from '../../Background'
import { IBaseTransService, IDictResult, ITransServiceConfig } from '../../types'

export * from './Language'

import { Google } from './Google'
import { GoogleFree } from './GoogleFree'
import { Youdao } from './Youdao'
import { Baidu } from './Baidu'
import { Tencent } from './Tencent.tsx'
import { Bing } from './Bing'
import { OpenAI } from './OpenAI'
import { GeminiPro } from './GeminiPro'
import { DeepL } from './DeepL'
import { AlibabaFree } from './AlibabaFree'
import { caiyun } from './CaiYun'
import { generateParams, racePromisesIgnoreErrors } from '../../Utils'
import { DetectType } from '../../Configuration'

export const plugins: IBaseTransService[] = [Youdao, Baidu, Tencent, Google, GoogleFree, Bing, OpenAI, GeminiPro, DeepL, caiyun, AlibabaFree]

function detectLanguage(service: IBaseTransService, lang: string) {
	for (const key of Object.keys(service.languages)) {
		if (lang === service.languages[key]) {
			return key
		}
	}
	return 'en'
}

export async function invokeLocalDetect(text: string) {
	return await invoke('lang_detect', { text }) as string
}

export async function detect(services: ITransServiceConfig[], text: string, type: DetectType): Promise<string> {
	if (type === 'local' || services.length < 1) {
		return invokeLocalDetect(text)
	}
	if (type === 'order') {
		//  按顺序检测
		for (const item of services) {
			try {
				const lang = await item.service.Detect!(item.params, text)
				if (lang) {
					return detectLanguage(item.service, lang)
				}
			} catch {}
		}
	} else if (type === 'concurrent') {
		//  并发检测，取最快返回的结果
		try {
			const res = await racePromisesIgnoreErrors(
				services.map(x => new Promise((resolve, reject) => {
					(x.service as IBaseTransService)
						.Detect!(x.params, text)
						.then(lang => resolve(detectLanguage(x.service, lang)))
						.catch(e => reject(e))
				}))
			) as { lang: string, service: IBaseTransService }
			return detectLanguage(res.service, res.lang)
		} catch {
			// handler erros
		}
	} else if (type === 'concurrent_most') {
		//  并发检测，取相同语种最多的结果
		const results = await Promise.allSettled(
			services.map(x => new Promise<{ status: boolean, lang?: string }>((resolve) => {
				(x.service as IBaseTransService).Detect!(x.params, text).then(lang => {
					resolve({ status: true, lang: detectLanguage(x.service, lang) })
				}).catch(() => {
					resolve({ status: false })
				})
			}))
		)
		const langList = results
			.filter(x => x.status === 'fulfilled' && x.value.status)
			.map(x => (x as any)['value']['lang']) as string[]
		if (langList.length) {
			const lang_count = {}
			for (const lang of langList) {
				if (lang_count[lang]) {
					lang_count[lang]++
				} else {
					lang_count[lang] = 1
				}
			}
			return Object
				.keys(lang_count)
				.reduce((a, b) => lang_count[a] > lang_count[b] ? a : b)
		}
	} else {
		const first = services.find(x => x.name === type)
		if (first) {
			try {
				const lang = await first.service.Detect!(first.params, text)
				if (lang) {
					return detectLanguage(first.service, lang)
				}
			} catch {
			}
		}
	}
	//  错误/未找到服务时回退到本地检测
	return invokeLocalDetect(text)
}


function textConvertTimeout(
	type: 'Dict' | 'Translate',
	config: ITransServiceConfig,
	text: string,
	from: string,
	to: string
): Promise<IDictResult | string> {
	let service = config.service
	const params = generateParams(
		service.ui,
		JSON.parse(JSON.stringify(config.params))
	)
	const time = config.timeout || 30 * 1000;
	return new Promise((resolve, reject) => {
		let isEnd = false
		let timeout: any
		function onEnd(err: Error | undefined, data?: IDictResult | string) {
			if (isEnd) return
			isEnd = true
			clearTimeout(timeout)
			if (err) {
				reject(new Error(`服务调用错误：${ err }`))
			} else {
				resolve(data)
			}
		}
		timeout = setTimeout(() => onEnd(new Error(`服务调用超时：${ time }ms`)), time)
		service[type](params, text, from, to)
			.then((res: IDictResult | string) => onEnd(undefined, res))
			.catch(onEnd)
	})
}

export async function textConvert(
	config: ITransServiceConfig,
	text: string,
	from: string,
	to: string,
	onlyDict: boolean
): Promise<IDictResult | string> {
	if (!config.service) {
		config.service = plugins.find(x => x.name === config.name)
	}
	if (!config.service) {
		throw new Error('该服务不提供翻译服务')
	}
	if (config.service?.Dict) {
		try {
			return textConvertTimeout('Dict', config, text, from, to)
		} catch (dictErr) {
			if (onlyDict) {
				throw new Error('词典翻译失败：' + dictErr)
			}
			if (!config.service.Translate) {
				throw new Error('该服务不提供文本翻译功能')
			}
			try {
				return textConvertTimeout('Translate', config, text, from, to)
			} catch (e) {
				throw new Error('文本翻译失败：' + e)
			}
		}
	} else {
		if (onlyDict) {
			throw new Error('该服务不提供词典翻译功能')
		}
		if (!config.service.Translate) {
			throw new Error('该服务不提供文本翻译功能')
		}
		return textConvertTimeout('Translate', config, text, from, to)
	}
}
