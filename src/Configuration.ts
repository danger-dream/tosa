import { reactive, watch, UnwrapNestedRefs } from 'vue'
import { IOcrServiceConfig, IServiceConfig, ITransServiceConfig } from './types'
import { debug } from './Logger.ts'
import { plugins as TransPlugins } from './Plugins/Translator'
import { plugins as OcrPlugins } from './Plugins/OCR'
import { deepEqual } from './Utils.ts'
import { invoke, listen, getLabel } from './Background'


export type OcrType = 'round' | 'concurrent' | 'first'
export type DetectType = 'local' | 'order' | 'concurrent' | 'concurrent_most' | string
export  type WinPosition = 'right-top' | 'center' | 'last' | 'mouse'
export class Configuration {
	/** 是否钉住窗口 */
	public pinup: boolean = false
	/** 显示翻译窗口快捷键 */
	public show_translator = ''
	/** 截图翻译快捷键 */
	public screenshot_translate = ''
	/** 划词翻译快捷键 */
	public selection_translate = ''
	/** 截图识别快捷键 */
	public screenshot_recognizer = ''

	/** OCR类型 */
	public ocr_type: OcrType = 'round'
	/** 图片识别成功才显示翻译窗口 */
	public ocr_succed_show_win = false
	/** 图片识别错误提示 */
	public ocr_err_tip = true

	/** 语言检测服务 */
	public detect_type: DetectType = 'concurrent'
	/** 默认的目标语种 */
	public to: string = 'zh_cn'
	/** 第二目标语种 */
	public to2: string = 'en'

	/** 是否只使用词典服务 */
	public only_dict = false
	/** 是否自动清空内容 */
	public auto_clear = false
	/** 自动复制内容到剪切板 */
	public auto_copy = false
	/** 首选的翻译服务 */
	public copy_type: 'first' | string = ''

	/** 默认的翻译服务超时时间 */
	public trans_timeout = 5000
	/** 默认的翻译服务重试次数 */
	public trans_retry_count = 1
	/** 默认的OCR服务超时时间 */
	public ocr_timeout = 5000
	/** 默认的OCR服务重试次数 */
	public ocr_retry_count = 1

	/** 翻译窗口位置 */
	public win_position: WinPosition = 'right-top'

	/** 是否开启历史记录 */
	public enable_cache = true
	/** 历史记录保存天数 */
	public cache_day = 0
	/** 历史记录最大数量 */
	public cache_max_count = 0
	/** 是否使用缓存 */
	public use_cache = true
	/** 清理缓存时，是否保留词典结果 */
	public reserve_word = false

	/** 是否开启ahk功能 */
	public enable_ahk = false

	/** 是否开启划词助手 */
	public enable_selection_assistant = false
	/** 取词方式 */
	public pickword_type: 'auto' | 'copy' | 'ui-automation' = 'auto'
	/** 小工具自动隐藏时间，为0时不自动隐藏 */
	public assistant_hide_timer: number = 0
	/** 划词工具栏启用的服务 */
	public assistants: string[] = []
	/** 是否启用过滤规则 */
	public enable_rule = false
	/** 跳过处理的进程，支持进程名称、进程路径（支持正则） */
	public assistant_rules: string[] = []

	/** 翻译服务 */
	public trans_services: IServiceConfig[] = []
	/** OCR服务 */
	public ocr_services: IServiceConfig[] = []
}
export type IConfiguration = UnwrapNestedRefs<Configuration>

export const configuration: IConfiguration = reactive(new Configuration())
let initConfiguration = false

function merge(target?: Configuration, source?: Configuration) {
	if (!target || !source) return
	for (const key in target) {
		const source_value = source[key]
		const target_value = target[key]
		if (source_value === undefined || typeof source_value !== typeof target_value) {
			continue
		}
		if (Array.isArray(target_value)) {
			target[key] = source_value
		} else if (typeof target_value === 'object') {
			merge(target[key], source_value)
		} else {
			target[key] = source_value
		}
	}
}

export async function useConfig(defaultConfig?: Record<string, any>) {
	if (initConfiguration) return configuration
	//  合并默认配置
	merge(configuration, defaultConfig as any)
	try {
		// 获取后台配置
		const file_config = await invoke<Record<string, any>>('get_config')
		if (file_config) {
			for (const key in file_config) {
				const value = file_config[key]
				if (!deepEqual(configuration[key], value)) {
					configuration[key] = value
				}
			}
		}
	} catch (e){
		debug(`load app config error: {}`, e)
	}

	let last = JSON.parse(JSON.stringify(configuration)) as Record<string, any>
	let stopWatch: Function = undefined
	function startWatch() {
		stopWatch = watch(() => configuration, async (newValue) => {
			for (const key of Object.keys(last)) {
				const oldValue = last[key] as any
				const v = newValue[key] as any
				if (!deepEqual(oldValue, v)) {
					await invoke('set_config_by_key', { key, value: v })
				}
			}
			last = JSON.parse(JSON.stringify(newValue)) as Record<string, any>
		}, { deep: true })
	}
	startWatch()

	await listen<{ key: string, value: any }>('config://updated', async (payload, windowLabel) => {
		if (windowLabel === getLabel()) return
		const { key, value } = payload
		if (value === null || value === undefined) return
		stopWatch()
		configuration[key] = value
		last = JSON.parse(JSON.stringify(configuration)) as Record<string, any>
		startWatch()
	})

	initConfiguration = true
	return configuration
}

export function generateTransConfig(item: IServiceConfig): ITransServiceConfig | undefined {
	if (!item.enable) return undefined

	const plugin = TransPlugins.find(x => x.name === item.name)
	if (!plugin) return undefined
	const temp = JSON.parse(JSON.stringify(item)) as ITransServiceConfig
	if (!temp.label) {
		temp.label = plugin.label || plugin.name
	}
	if (configuration.only_dict) {
		if (!plugin.Dict){
			return undefined
		}
	} else if (!item.transVerify && !plugin.Dict) return undefined
	temp.service = plugin
	return temp
}

export function generateOcrConfig(item: IServiceConfig): IOcrServiceConfig | undefined {
	if (!item.enable) return undefined
	if (!item.ocrVerify) return undefined
	const plugin = OcrPlugins.find(x => x.name === item.name)
	if (!plugin) return undefined
	const temp = JSON.parse(JSON.stringify(item)) as IOcrServiceConfig
	if (!temp.label) {
		temp.label = plugin.label || plugin.name
	}
	temp.service = plugin
	return temp
}
