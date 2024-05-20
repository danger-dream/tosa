<script setup lang="ts">
import { messageBox, ask, shellOpen, showMenu } from '../Background'
import { nextTick, onMounted, reactive, computed } from 'vue'
import { ElForm, ElFormItem, ElInput, ElInputNumber, ElCheckbox, ElSelect, ElOption } from 'element-plus'
import ace from 'ace-builds'
import { VAceEditor } from 'vue3-ace-editor'
import modeJsonUrl from 'ace-builds/src-noconflict/mode-json?url'
import themeGithubUrl from 'ace-builds/src-noconflict/theme-github?url'
import { configuration } from '../Configuration.ts'
import { IBaseService, ITransServiceConfig, IOcrServiceConfig, IServiceConfig } from '../types'
import { deepEqual, generateParams, uuid } from '../Utils'
import { plugins as TransPlugins } from '../Plugins/Translator'
import { plugins as OcrPlugins } from '../Plugins/OCR'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/form-item/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/input-number/style/css'
import 'element-plus/es/components/checkbox/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'animate.css'

ace.config.setModuleUrl('ace/mode/json', modeJsonUrl)
ace.config.setModuleUrl('ace/theme/github', themeGithubUrl)
const AceOptions = {
	useWorker: false, fontSize: '12px', tabSize: 4, wrap: true,
	showLineNumbers: false, showFoldWidgets: true, vScrollBarAlwaysVisible: true
}

const state = reactive({
	active: '',
	services: [] as ITransServiceConfig[] | IOcrServiceConfig[],
	service: null as ITransServiceConfig | IOcrServiceConfig,
	serviceId: ''
})
const conf = computed(() => state.service)
const service = computed(() => state.service?.service)

onMounted(() => onToggleActive('translate'))


async function onToggleActive(name: 'translate' | 'ocr') {
	state.active = ''
	await nextTick()
	state.active = name
	let plugins: IBaseService[]
	let timeout: number
	let retry: number
	if (name === 'translate') {
		timeout = configuration.trans_timeout
		retry = configuration.trans_retry_count
		plugins = TransPlugins
		state.services = JSON.parse(JSON.stringify(configuration.trans_services)) as ITransServiceConfig[]
	} else {
		timeout = configuration.ocr_timeout
		retry = configuration.ocr_retry_count
		plugins = OcrPlugins
		state.services = JSON.parse(JSON.stringify(configuration.ocr_services)) as IOcrServiceConfig[]
	}
	for (const item of state.services) {
		item.service = plugins.find((x) => x.name === item.name)
		if (!item.id) {
			item.id = uuid()
		}
		if (!item.params) {
			item.params = {}
		}
		if (item.label === undefined) {
			item.label = item.service.label || item.name
		}
		if (item.timeout === undefined) {
			item.timeout = timeout
		}
		if (item.retry === undefined) {
			item.retry = retry
		}
		generateParams(item.service!.ui, item.params)
	}

	if (state.services.length) {
		onSelectService(state.services[0])
	}
}

function onSelectService(service: ITransServiceConfig | IOcrServiceConfig) {
	state.service = null
	nextTick().then(() => {
		state.service = service
		state.serviceId = service.id!
	})
}

function addService(e: MouseEvent) {
	const rect = (e.target as Element).getBoundingClientRect()

	let plugins: IBaseService[] = []
	if (state.active === 'translate') {
		plugins = TransPlugins
	} else if (state.active === 'ocr') {
		plugins = OcrPlugins
	}
	showMenu({
		position: {
			x: rect.left + window.scrollX,
			y: rect.top + window.scrollY + 30
		},
		items: plugins.map((x) => ({ label: x.label, payload: x.name }))
	}, function(payload: string){
		const plugin = plugins.find((x) => x.name === payload)
		if (!plugin) return
		const item: ITransServiceConfig | IOcrServiceConfig = {
			id: uuid(),
			name: plugin.name,
			label: plugin.label || plugin.name,
			enable: true,
			params: generateParams(plugin.ui, {}),
			timeout: 5000,
			retry: 1,
			service: plugin
		}
		state.services.push(item as any)
		onSelectService(item)
	})
}

function delService() {
	if (!conf.value) return
	ask(
		`是否确定要删除"${ conf.value.label }"服务?`,
		{ title: '确认', type: 'warning', okLabel: '删除', cancelLabel: '取消' }
	).then((res) => {
		if (!res) return
		const index = state.services.findIndex((x: any) => x.id === conf.value.id)
		if (index === -1) return
		state.services.splice(index, 1)

		if (state.services[index]) {
			onSelectService(state.services[index])
		} else if (state.services[index - 1]) {
			onSelectService(state.services[index - 1])
		} else if (state.services.length) {
			onSelectService(state.services[0])
		} else {
			state.service = null
			state.serviceId = ''
		}
	})
}

const TestValue = {
	Detect: 'Hello World!',
	Translate: 'Hello World!',
	OCR: 'iVBORw0KGgoAAAANSUhEUgAAAGYAAAARCAYAAAAv+NkbAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAH3SURBVFhH7ZWrlsIwEIb3kRa3leyboLA8AgqNxlQjMXgMBs+pwu9TZHPpNH8mmdILuyecE/Ef6CRz/ZL24/NrqYryUwGTqQqYTFXAZKoAzGJ3Uc3jorbVt7dVe3V6/KjTztv6tFgf1VXvb1pxv0W1UYebX2/O+2B9rlI9WLvt464O62F9PNOqvvseEvm4pDnSvLj95WBIQ/y25/cFQ5LycRUwttF3AxPXNQlMeI3Tzc4BQ75jXhUkbBQhuZg+Dp3ULsftqFaQw9R2rTdBr+aZ1kl9YNwa5NCKwNi6BoEJA5EooCsUGrQ+ceCpYMgPh8Bz9gkbpX5MDQGkFgrWZmsBOPZZ7yEbAicfIwkMn4s0jxFgwiQYkD7cGJxs/DRJhaCSYJ7UgHtTwka3Z/1b63g6B4KxoNkN4YPnoKQaJDDGH2ci+kO9aB8Jxv3Hm0R6FZjk0AT4KfnDY351L2bgJh796rjJA8HqTe1JKT2zuF5pHs7+BzdG0lQw829MW2OtQZibYp/bm9OCGXxj/gGMpNEf/6Hv+8lgWj9syu5jg5REQ8Fb7Gr2ufg3pvOBWuaAMUL41JOpgc+D10IaDcaoa7STP2nxmhMNiQqJ9sDgoz0DoZDsUKEm15e2waA7G4lB6AOD8ENBTrbHvVonginKRwVMpipgstRS/QJn21LtEL9AxAAAAABJRU5ErkJggg=='
}

async function onTest() {
	if (!conf.value) return
	if (state.active === 'translate') {
		const service = conf.value as ITransServiceConfig
		const params = service.params
		if (service.service?.Detect) {
			try {
				await service.service.Detect(params, TestValue.Detect)
			} catch (e) {
				try {
					if(!await ask(
						`验证「${ service.label }」服务「语种识别」功能时发生错误：${ e?.message || e }`,
						{ title: '错误', type: 'error', okLabel: '继续', cancelLabel: '检查' }
					)) {
						return
					}
				} catch {
					return
				}
			}
		}
		const from_lang = service.service.languages['en']
		const to_lang = service.service.languages['zh_cn']
		if (service.service?.Dict) {
			try {
				await service.service.Dict(params, TestValue.Translate, from_lang, to_lang)
			} catch (e) {
				try {
					if(!await ask(
						`验证「${ service.label }」服务「词典翻译」功能时发生错误：${ e?.message || e }`,
						{ title: '错误', type: 'error', okLabel: '继续', cancelLabel: '检查' }
					)) {
						return
					}
				} catch {
					return
				}
			}
		}
		if (service.service?.Translate) {
			try {
				await service.service.Translate(params, TestValue.Translate, from_lang, to_lang)
			} catch (e) {
				await messageBox(
					`验证「${conf.value.label}」服务「文本翻译」功能时发生错误：${ e?.message || e }`,
					{ title: '错误', type: 'error' }
				)
				return
			}
		}
	} else {
		const service = conf.value as IOcrServiceConfig
		if (service.service?.Ocr) {
			try {
				await service.service.Ocr(service.params, TestValue.OCR)
			} catch (e) {
				await messageBox(`验证「${conf.value.label}」服务「图片识别」功能时发生错误：${e?.message || e}`, {
					title: '错误',
					type: 'error'
				})
				return
			}
		}
	}
	await messageBox('验证通过', { title: '提示', type: 'info' })
}

function onRestore() {
	onToggleActive(this.active)
}

function getChangeConfig() {
	const result: IServiceConfig[] = []
	const old_services = (
		state.active === 'translate'
			? configuration.trans_services
			: configuration.ocr_services
	) as IServiceConfig[]

	for (const item of state.services){
		const old_item = old_services.find((x) => x.id === item.id)
		if (old_item) {
			if (item.enable !== old_item.enable ||
				item.label !== old_item.label ||
				item.retry !== old_item.retry ||
				item.timeout !== old_item.timeout) {
				// 基础参数有变化
				result.push(item)
				continue
			}
			//	服务参数有变化
			if (deepEqual(item.params, old_item.params)) continue
		}
		// else 新增服务
		result.push(item)
	}
	return result
}

async function onSave() {
	if (!state.services.length) {
		await messageBox('没有可用的服务', { title: '提示', type: 'info' })
		return
	}
	const update_services = getChangeConfig()
	if (!update_services.length) {
		await messageBox('没有需要保存的设置', { title: '提示', type: 'info' })
		return
	}
	const old_services = (
		state.active === 'translate'
			? configuration.trans_services
			: configuration.ocr_services
	) as IServiceConfig[]
	for (const item of update_services) {
		if (!item.enable) {
			continue
		}
		const old_item = old_services.find((x) => x.id === item.id)
		if (old_item && deepEqual(item.params, old_item.params)) continue
		try {
			if (state.active === 'translate') {
				const service = item as ITransServiceConfig
				const params = service.params
				if (service.service?.Detect) {
					try {
						await service.service.Detect(params, TestValue.Detect)
						item.detectVerify = true
					} catch (e) {
						item.detectVerify = false
						try {
							if (!await ask(
								`验证「${ item.label }」服务「语种识别」功能时发生错误：${ e?.message || e }`,
								{ title: '错误', type: 'error', okLabel: '忽略错误', cancelLabel: '检查' }
							)) {
								throw ''
							}
						} catch {
							onSelectService(item as any)
							return
						}
					}
				}
				const from_lang = service.service.languages['en']
				const to_lang = service.service.languages['zh_cn']
				if (service.service?.Dict) {
					try {
						await service.service.Dict(params, TestValue.Translate, from_lang, to_lang)
						item.dictVerify = true
					} catch (e) {
						item.dictVerify = false
						try {
							if (!await ask(
								`验证「${ item.label }」服务「词典翻译」功能时发生错误：${ e?.message || e }`,
								{ title: '错误', type: 'error', okLabel: '忽略错误', cancelLabel: '检查' }
							)) {
								throw ''
							}
						} catch {
							onSelectService(item as any)
							return
						}
					}
				}
				if (service.service?.Translate) {
					await service.service.Translate(params, TestValue.Translate, from_lang, to_lang)
					item.transVerify = true
				}
			} else {
				const service = item as IOcrServiceConfig
				if (service.service?.Ocr) {
					await service.service.Ocr(service.params, TestValue.OCR)
					item.ocrVerify = true
				}
			}
		} catch (e) {
			if (state.active === 'translate') {
				item.transVerify = false
			} else {
				item.ocrVerify = false
			}
			try {
				if(!await ask(
					`验证「${ item.label }」服务时发生错误：${ e?.message || e }`,
					{ title: '错误', type: 'error', okLabel: '忽略错误', cancelLabel: '检查' }
				)) {
					throw ''
				}
			} catch {
				onSelectService(item as any)
				return
			}
		}
	}
	const deep = JSON.parse(JSON.stringify(state.services)) as IServiceConfig[]
	deep.map((x: any) => delete x.service)
	if (state.active === 'translate') {
		configuration.trans_services = deep
	} else {
		configuration.ocr_services = deep
	}
	await messageBox('保存成功', { title: '提示', type: 'info' });
}
</script>

<template>
	<div class="flex flex-col w-full h-full" data-tauri-drag-region>
		<div class="flex items-center m-1 font-medium text-center ml-5 my-5 rounded-lg text-base" data-tauri-drag-region>
			<button class="px-9 py-1 rounded-lg hover:bg-white me-3" :class="state.active === 'translate' && 'bg-white'"
				@click="onToggleActive('translate')">
				文本翻译
			</button>
			<button class="px-9 py-1 rounded-lg hover:bg-white me-3" :class="state.active === 'ocr' && 'bg-white'"
				@click="onToggleActive('ocr')">
				图片识别
			</button>
		</div>
		<div v-if="state.active" class="w-full" style="height: calc(100% - 60px)">
			<div class="flex px-5 mt-0" style="height: calc(100% - 60px)">
				<div class="flex flex-col w-[300px] h-full rounded-lg bg-white overflow-y-auto">
					<div v-for="item in state.services" :key="item.id" @click="onSelectService(item)"
						class="flex flex-col p-4 hover:bg-[var(--bg3)]"
						:class="state.serviceId === item.id && 'bg-[var(--bg3)]'">
						<div class="flex items-center justify-between">
							<div class="flex items-center">
								<img :src="item.service.icon" class="mr-2 w-7 h-7 rounded-lg" />
								<div class="text-base">{{ item.label || item.name }}</div>
							</div>
							<div class="relative inline-flex items-center cursor-pointer" @click="item.enable = !item.enable">
								<input type="checkbox" v-model="item.enable" class="sr-only peer focus:shadow-none" />
								<div class="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--primary)]" />
							</div>
						</div>
						<div v-if="item.service" class="flex justify-start mt-2">
							<span v-if="item.service['Translate']" class="tag bg-blue-100">文本翻译</span>
							<span v-if="item.service['Dict']" class="tag bg-green-100">词典翻译</span>
							<span v-if="item.service['Detect']" class="tag bg-red-100">语种识别</span>
						</div>
					</div>
				</div>
				<Transition name="custom-classes" enter-active-class="animate__animated animate__fadeIn">
					<div v-if="conf" style="width: calc(100% - 300px)"
						class="flex flex-col rounded-lg bg-white ml-5 p-5 text-[var(--text-color)] overflow-y-auto">
						<div v-if="service.helpLink" class="flex justify-end text-sm text-[var(--primary)]">
							<a href="#" @click="shellOpen(service.helpLink)">如何配置?</a>
						</div>
						<div v-if="service.explain" class="mb-6 text-base text-wrap">
							{{ service.explain }}
						</div>
						<div v-if="service.components">
							<component :is="service.components(conf)" />
						</div>
						<el-form v-else-if="service.ui.length" label-width="80px">
							<div class="mb-4 text-base font-bold">接口设置：</div>
							<el-form-item v-for="item in service.ui" :key="item.name" :label="item.label" size="small">
								<template v-if="item.components">
									<component :is="item.components(conf.params)" />
								</template>
								<template v-else>
									<el-input v-if="item.type === 'input' || item.type === 'password'"
										v-model="conf.params[item.name]" :type="item.type"
										:show-password="item.type === 'password'"
										:placeholder="'请输入' + item.label" clearable
									/>
									<el-input v-else-if="item.type === 'textarea'" v-model="conf.params[item.name]" type="textarea"
										:placeholder="'请输入' + item.label" :min="2" :max="6" resize="none"
									/>
									<el-checkbox v-else-if="item.type === 'checkbox'" v-model="conf.params[item.name]">
										{{ item.label }}
									</el-checkbox>
									<el-select v-else-if="item.type === 'select'" v-model="conf.params[item.name]">
										<el-option v-for="o in item.dict" :key="o.value" :label="o.label" :value="o.value" />
									</el-select>
									<div v-else-if="item.type === 'code'" class="flex h-[250px] w-full border border-[#E8E8E8]">
										<VAceEditor v-model:value="conf.params[item.name]" class="flex text-lg w-full"
											lang="json" theme="github" :options="AceOptions" />
									</div>
									<div v-if="item.explain" class="text-[var(--placeholder)] text-wrap">
										{{ item.explain }}
									</div>
								</template>
							</el-form-item>
						</el-form>
						<div class="mt-5">
							<div class="mb-4 text-base font-bold">高级设置：</div>
							<el-form label-width="80px" size="small">
								<el-form-item label="接口名称">
									<el-input v-model="conf.label" />
									<div class="text-[var(--placeholder)] text-wrap">
										自定义接口名称，用于区分同一服务不同设置的接口
									</div>
								</el-form-item>
								<el-form-item label="超时时间">
									<el-input-number v-model="conf.timeout" controls-position="right" :precision="0"
										:min="0" :max="120 * 1000" :step="1000" />
									<div class="text-[var(--placeholder)] text-wrap">超时时间，单位毫秒</div>
								</el-form-item>
								<el-form-item label="重试次数">
									<el-input-number v-model="conf.retry" controls-position="right" :precision="0"
										:min="1" :max="5" :step="1" />
									<div class="text-[var(--placeholder)] text-wrap">调用服务错误时的重试次数</div>
								</el-form-item>
							</el-form>
						</div>
					</div>
				</Transition>
			</div>
			<div class="flex justify-between mx-5 h-[60px]" data-tauri-drag-region>
				<div class="flex">
					<div class="flex items-center text-center text-base">
						<button @click="addService" class="btn">+</button>
						<button @click="delService" class="btn">-</button>
					</div>
				</div>
				<div class="flex justify-end items-center m-1 font-medium text-base text-center">
					<button class="btn" @click="onTest">测试服务</button>
					<button class="btn" @click="onRestore">还原</button>
					<button class="btn" @click="onSave">保存</button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
:deep(.el-input) {--el-input-border-radius: 8px;}
:deep(.el-form-item__label) {color: var(--text-color);}
</style>
