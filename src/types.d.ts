export interface IUiConfig {
	/** 序号 */
	sort?: number
	/** 唯一标识 */
	name: string
	/** 显示名称 */
	label: string
	/** 类型 */
	type?: 'input' | 'select' | 'textarea' | 'password' | 'number' | 'checkbox' | 'code'
	/** 为textarea时的最小行 */
	minRows?: number
	/** 为textarea时的最大行 */
	maxRows?: number

	/** TSX组件 */
	components?(params: Record<string, any>): any

	/** 默认值 */
	default?: any
	/** 解释 */
	explain?: string
	/** 选项 */
	dict?: { label: string; value: any }[]
}

/** 基础服务 */
export interface IBaseService {
	/** 唯一名称 */
	name: string
	/** 显示名称 */
	label: string
	/** 图标 */
	icon: string
	/** 解释、说明 */
	explain?: string
	/** 帮助链接 */
	helpLink?: string
	/** 翻译插件UI配置项 */
	ui: IUiConfig[]

	/** 翻译插件UI TSX组件 */
	components?(conf: IServiceConfig): any
}

export interface IDictResult {
	text: string
	phonetic?: string
	pronunciations?: {
		region?: string
		symbol?: string
		voice?: string
	}[]
	explanations?: {
		trait: string
		explains: string[]
	}[]
	sentence?: string[]
	wfs?: { name: string; value: string }[]
	web?: { name: string; list: string[] }[]
}

export interface IBaseTransService extends IBaseService {
	/** 翻译插件支持的语言: key、value，翻译时会把from、to转换为value、语种识别时会把value转换为key */
	languages: Record<string, string>

	/** 语言检测 */
	Detect?(params: Record<string, string>, text: string): Promise<string>

	/** 翻译 */
	Translate?(params: Record<string, string>, text: string, from: string, to: string): Promise<string>

	/** 词典 */
	Dict?(params: Record<string, string>, text: string, from: string, to: string): Promise<IDictResult>
}

export interface IBaseOcrService extends IBaseService {
	/** OCR识别 */
	Ocr?(params: Record<string, any>, img: string, retry_count?: number): Promise<string>
}

export interface IBaseSelectionTranslator {
	name: string
	label: string
	icon: string
	description?: string

	Verify(text: string): Promise<boolean> | boolean
	Invoke(text: string): Promise<void> | void
}


export interface IServiceConfig {
	/** 翻译插件唯一标识名(同一插件可多个服务) */
	id?: string
	/** 服务名称 */
	name: string
	/** 服务显示名称 */
	label?: string
	/** 服务是否启用 */
	enable?: boolean
	/** 服务参数 */
	params?: Record<string, any>
	/** 超时毫秒数 */
	timeout?: number
	/** 重试次数 */
	retry?: number
	/** 语种识别是否验证通过 */
	detectVerify?: boolean
	/** 文本翻译是否验证通过 */
	transVerify?: boolean
	/** 文本翻译是否验证通过 */
	dictVerify?: boolean
	/** 图片识别是否验证通过 */
	ocrVerify?: boolean
}

export interface ITransServiceConfig extends IServiceConfig {
	service: IBaseTransService
}

export interface IOcrServiceConfig extends IServiceConfig {
	service: IBaseOcrService
}


