import { ref, Ref, watch } from 'vue'
import {
	emit, getSize,
	hideWindow,
	invoke,
	isVisible,
	listen,
	messageBox,
	setAlwaysOnTop, setFocus, setSize,
	writeClipboardText
} from '../Background'
import { IConfiguration, configuration, generateTransConfig, generateOcrConfig } from '../Configuration.ts'
import { detect, LanguageZh, textConvert, invokeLocalDetect } from '../Plugins/Translator'
import { IDictResult, ITransServiceConfig } from '../types'
import { CacheHelper } from '../CacheHelper.ts'
import { uuid } from '../Utils.ts'
import TargetView from './TargetView.vue'
import { ocrRecognize } from '../Plugins/OCR'


class Store {
	private cache: CacheHelper

	public text: Ref<string> = ref('')
	public src: Ref<string> = ref('auto')
	public target: Ref<string> = ref('zh_cn')

	/** 是否正在识别语种 */
	public isDetecting: Ref<boolean> = ref(false)
	/** 是否正在翻译 */
	public isTranslating: Ref<boolean> = ref(false)
	/** 是否正在识别图片 */
	public isRecogning: Ref<boolean> = ref(false)
	/** 识别到的语种 */
	public detect_language: Ref<string> = ref('')

	public serviceEl: Map<string, InstanceType<typeof TargetView>> = new Map()

	public gorupId: string = ''

	public checkScrollHeight: Function

	async init(conf: IConfiguration) {
		this.cache = new CacheHelper('translate')
		this.cache.setConfig(conf.cache_day, conf.cache_max_count, conf.reserve_word)
		if (conf.enable_cache) {
			await this.cache.start()
		}
		this.target.value = conf.to
		const self = this

		await listen<{ key: string, value: any }>('config://updated', function(payload) {
			const { key, value } = payload
			switch (key) {
				case 'pinup':
					setAlwaysOnTop(value)
					return
				case 'cache_day':
					self.cache.max_day = value
					return
				case 'cache_max_count':
					self.cache.max_count = value
					return
				case 'reserve_word':
					self.cache.reserve_word = value
					return
				case 'enable_cache': {
					if (value) {
						self.cache.start().catch(() => {
						})
					} else {
						self.cache.stop().catch(() => {
						})
					}
					return
				}
			}
		})

		type IPayload = { action: 'screenshot_translate' | 'screenshot_recognizer', base64: string }
		await listen<IPayload>('ocr://clip', function(payload) {
			if (self.isTranslating.value || self.isRecogning.value) return
			const { base64, action } = payload
			if (action === 'screenshot_translate') {
				self.ocrRecognize(base64, true)
			} else if (action === 'screenshot_recognizer') {
				self.ocrRecognize(base64, false)
			}
		})

		await listen<string>('translator://text', async function(text) {
			if (self.isTranslating.value || self.isRecogning.value) return
			if (!text) return
			if (!await isVisible()) {
				await invoke('show_trans_win', { focus: false })
			}
			await self.clear()
			self.text.value = text
			await self.translate()
		})

		window.addEventListener('blur', async () => {
			try {
				if (await invoke('active_window_is_self')) {
					return
				}
			} catch {
			}
			await setAlwaysOnTop(conf.pinup)
			if (!conf.pinup) {
				hideWindow()
			}
		})

		watch(this.text, async (value) => {
			if (value) {
				this.detect_language.value = await invokeLocalDetect(value)
			} else {
				this.detect_language.value = ''
			}
		})
	}

	private async language_detect(value: string) {
		if (this.isDetecting.value) return false
		this.detect_language.value = ''
		value = value.trim()
		if (!value) return false
		const self = this
		this.isDetecting.value = true
		const detects = configuration.trans_services
			.map(generateTransConfig)
			.filter(x => x?.service?.Detect && x?.dictVerify)
		try {
			this.detect_language.value = await detect(detects, value, configuration.detect_type)
		} catch {
		} finally {
			self.isDetecting.value = false
		}
		return true
	}


	async clear() {
		this.text.value = ''
		this.detect_language.value = ''
		for (const [_key, target] of this.serviceEl) {
			await target.clear()
		}
	}

	async translate() {
		if (this.isTranslating.value || this.isRecogning.value || this.serviceEl.size < 1) return
		this.isTranslating.value = true
		if (this.src.value === 'auto') {
			await this.language_detect(this.text.value)
		}
		const self = this
		let total = this.serviceEl.size
		this.gorupId = uuid()
		let first = false

		function handleResult({ id, data }: { id: string, data: string | IDictResult }) {
			if (!data) return
			if (
				configuration.auto_copy && (
					(!first && configuration.copy_type === 'first') ||
					(id === configuration.copy_type)
				)
			) {
				self.copyResult(data)
			}
			first = true
		}

		function handleEnd() {
			total--
			if (total === 0) {
				self.isTranslating.value = false
			}
		}

		for (const el of this.serviceEl.values()) {
			if (!el?.translate) {
				handleEnd()
				continue
			}
			el.translate().then(handleResult).finally(handleEnd)
		}
	}

	async retryTranslate(group_id: string, config: ITransServiceConfig, text: string, from: string, to: string, cache: boolean) {
		let { label, retry } = config
		const service = config.service
		if (from === 'auto' && !service.languages[from]) {
			from = this.detect_language.value
		}
		if (from === to || (from === 'auto' && to === this.detect_language.value)) {
			if (this.detect_language.value !== configuration.to2) {
				to = configuration.to2
			} else {
				to = Object.keys(service.languages).find(x => x !== to && x !== 'auto')
				if (!to) {
					throw new Error(`当前设定源语种为: ${LanguageZh[from]}，检测语种为: ${LanguageZh[this.detect_language.value]}, 未找到可用的目标语种`)
				}
			}
		}
		if (service.languages[from] === undefined) {
			throw new Error('不支持的源语种: ' + LanguageZh[from])
		} else {
			from = service.languages[from]
		}
		if (service.languages[to] === undefined) {
			throw new Error('不支持的目标语种: ' + LanguageZh[to])
		} else {
			to = service.languages[to]
		}
		let only_dict = configuration.only_dict
		//  是否使用缓存
		if (configuration.use_cache && cache) {
			const cache_string = this.cache.get(service.name, text, from, to)
			if (cache_string) {
				this.cache.hit(cache_string.id)
				return cache_string.result
			}
		}
		retry = retry || configuration.trans_retry_count || 1
		const retry_error_result: string[] = []
		for (let i = 0; i < retry; i++) {
			try {
				const st = Date.now()
				const result = await textConvert(config, text, from, to, only_dict)
				if (result) {
					if (configuration.enable_cache) {
						this.cache.add(
							group_id, service.name, label || service.label, this.text.value,
							from, to, result, Date.now() - st
						)
					}
					return result
				}
			} catch (e) {
				retry_error_result.push(`第${i + 1}次调用发生错误: ${e.message}`)
			}
		}
		throw new Error(retry_error_result.join('\n'))
	}

	public async ocrRecognize(base64: string, trans: boolean) {
		if (this.isRecogning.value) return
		if (!base64) {
			if (configuration.ocr_err_tip) {
				await messageBox('未找到图片数据', { title: '错误', type: 'error' })
			}
			return
		}
		const ocr_services = configuration.ocr_services
			.map(x => generateOcrConfig(x))
			.filter(x => x?.enable)
		if (ocr_services.length === 0) {
			if (configuration.ocr_err_tip) {
				await messageBox('不存在可使用的OCR识别服务', { title: '错误', type: 'error' })
			}
			return
		}
		this.isRecogning.value = true
		if (!configuration.ocr_succed_show_win) {
			await invoke('show_trans_win', { focus: false })
		}
		await this.clear()
		try {
			const text = await ocrRecognize(
				ocr_services,
				configuration.ocr_type,
				configuration.ocr_retry_count,
				base64
			)
			if (!text.trim()) {
				throw new Error('未识别到文字')
			}
			if (configuration.ocr_succed_show_win) {
				await invoke('show_trans_win', { focus: false })
			}
			this.text.value = text
			this.isRecogning.value = false
			if (trans) {
				this.translate().catch(() => {
				})
			} else {
				emit('translator://focus/no-clear')
			}
		} catch (e) {
			this.isRecogning.value = false
			if (configuration.ocr_err_tip) {
				await messageBox(e.message, { title: '错误', type: 'error' })
			}
		}
	}

	async copyResult(res: string | IDictResult) {
		const str = (typeof res === 'string' ? res : res.text)
		if (str?.trim()) {
			await writeClipboardText(str)
			// 通知??
		}
	}

	public async resetSize() {
		const curSize = await getSize()
		let scrollHeight = document.documentElement.scrollHeight
		let height = document.documentElement.offsetHeight
		if (height > scrollHeight) {
			height = scrollHeight
		}
		// 处理超过屏幕高度的情况.....
		height += 1
		await setSize(curSize.width, Math.floor(height))
		await setFocus()
		this.checkScrollHeight && this.checkScrollHeight()
	}
}

export const TranslatorStore = new Store()