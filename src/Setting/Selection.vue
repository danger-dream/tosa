<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { ElForm, ElFormItem, ElInputNumber, ElCheckbox, ElSelect, ElOption, ElInput } from 'element-plus'
import { invoke, listen } from '../Background'
import { configuration as conf } from '../Configuration'
import { plugins } from '../Plugins/Selection'
import Logger from './Logger.vue'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/form-item/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/input-number/style/css'
import 'element-plus/es/components/checkbox/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/input/style/css'

const size = {width: 20, height: 20, spacing: 4, padding: 4, box_padding: 4}
const logger = ref<InstanceType<typeof Logger>>(null)
const filter_rule_str = ref(conf.assistant_rules.join('\n'))
const running = ref(false)
const actionType = {
	click: '单击',
	'double-click': '双击',
	'long-click': '长按'
}
watch(filter_rule_str, (val) => {
	conf.assistant_rules = val.split('\n').map(item => item.trim()).filter(item => item)
})
const cur_plugins = computed(() => {
	return plugins.filter(item => conf.assistants.includes(item.name))
})

let timer: NodeJS.Timeout | null = null
let mouseEventUnlisten: any = null

onMounted(async () => {
	timer = setInterval(async function() {
		try {
			running.value = await invoke('selection_state')
		} catch {}
	}, 1000)
	mouseEventUnlisten = await listen<Record<string, any>>('selection://mouse-event', (data) => {
		const { action, x, y, type } = data
		let msg = ''
		switch (type) {
			case 'distance_insufficient':
				msg = `上次位置 (${data.last_x}, ${data.last_y}), 移动距离不足`
				break
			case 'process_info':
				msg = `获取进程到信息 ${data.app_name}(${data.pid}) - ${data.title} ${data.path}`
				break
			case 'process_info_self':
				msg = `跳过本身进程处理`
				break
			case 'process_info_error':
				msg = `获取进程信息失败`
				break
			case 'hit_rule':
				msg = `命中过滤规则 ${data.rule}`
				break
			case 'text_short':
				if (data.text) {
					msg = `取词文本过短 ${data.text}`
				} else {
					msg = `未获取到可用文本`
				}
				break
			case 'text':
				msg = `取词文本 ${data.text}`
				break
		}
		logger.value?.log(`${ actionType[action] }(${x}, ${y}): ${msg}`)
	})
})

onUnmounted(() => {
	if (mouseEventUnlisten) {
		mouseEventUnlisten()
	}
	if (timer) {
		clearInterval(timer)
		timer = null
	}
})

async function toggleRunningState() {
	if (running.value) {
		await invoke<any>('selection_stop')
		running.value = false
		logger.value?.success('划词助手已停止')
		return
	}
	try {
		await invoke<any>('selection_start')
		running.value = true
		logger.value?.success('划词助手已启动')
	} catch (e) {
		logger.value?.error(`划词助手启动失败: ${e}`)
		running.value = false
	}
}
</script>

<template>
	<div class="w-full h-full">
		<div class="flex flex-col h-full">
			<div class="flex-grow h-full overflow-y-auto p-5">
				<el-form label-width="250px" class="m-2">
					<ElFormItem label="启用划词">
						<ElCheckbox v-model="conf.enable_selection_assistant">是否启用划词助手</ElCheckbox>
						<div class="flex items-center m-2">
							<button class="btn" @click.stop.prevent="toggleRunningState">
								{{ running ? '停止划词助手' : '运行划词助手' }}
							</button>
							<template v-if="running">
								<div class="relative flex h-3 w-3 ml-2">
									<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#67c23a] opacity-75"></span>
									<span class="relative inline-flex rounded-full h-3 w-3 bg-[#67c23a]"></span>
								</div>
								<div class="ml-1">运行中</div>
							</template>
							<template v-else>
								<div class="relative flex h-3 w-3 ml-2">
									<span class="relative inline-flex rounded-full h-3 w-3 bg-[#ADADAD]"></span>
								</div>
								<div class="ml-1">未运行</div>
							</template>
						</div>
					</ElFormItem>
					<ElFormItem label="取词方式">
						<ElSelect v-model="conf.pickword_type" placeholder="请选择取词方式" style="width: 250px">
							<ElOption label="自动模式" value="auto" />
							<ElOption label="模拟按键" value="copy" />
							<ElOption label="UIAutomation" value="ui-automation" />
						</ElSelect>
						<div class="item-tip">
							<p>自动模式会优先使用「UIAutomation」方式取词，如果失败会使用模拟按键进行取词</p>
							<p>「UIAutomation」仅支持部分应用，取词过程没有副作用</p>
							<p>模拟按键方式对「Ctrl+C」敏感的程序会造成影响，比如SSH、JetBrains全家桶等</p>
						</div>
					</ElFormItem>
					<ElFormItem label="自动隐藏">
						<ElInputNumber v-model="conf.assistant_hide_timer" controls-position="right"
									   :min="0" :max="60*1000*5" :step="100" />
						<div class="item-tip">
							工具栏自动隐藏时间，单位：毫秒，1秒等于1000毫秒，为0时不自动隐藏
						</div>
					</ElFormItem>
					<ElFormItem label="启用功能">
						<ElSelect v-model="conf.assistants" placeholder="请选择功能" multiple>
							<ElOption v-for="item in plugins" :key="item.name" :label="item.label" :value="item.name" />
						</ElSelect>
						<div class="item-tip">
							选中的功能将在划词工具栏中按顺序显示
						</div>
					</ElFormItem>
					<ElFormItem label="实时预览" v-if="cur_plugins.length">
						<div class="overflow-hidden bg-white rounded p-5 w-full border border-[#dcdfe6]">
							<div class="flex justify-center">
								<div class="flex items-center rounded-lg bg-[#efefef] space-x-1"
									 :style="{ padding: size.box_padding + 'px' }">
									<div v-for="item in cur_plugins" :key="item.name" class="rounded-lg hover:bg-[#D7D9DC] active:bg-[#b3b3b3]"
										 :style="{ padding: size.padding + 'px' }">
										<img :src="`/icon/${ item.icon }.svg`"
											 :style="{ height: size.height + 'px', width: size.width + 'px' }"/>
									</div>
								</div>
							</div>
						</div>
					</ElFormItem>
					<ElFormItem label="过滤规则">
						<ElCheckbox v-model="conf.enable_rule">是否启用过滤规则</ElCheckbox>
						<ElInput v-model="filter_rule_str" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }"
								 resize="none" autosize placeholder="请输入跳过进程，每行一个" />
						<div class="item-tip">
							<p>跳过处理的进程、窗口类名，支持进程名称（忽略大小写）、进程路径（支持正则）</p>
							<p>在使用模拟按键取词方式的时候建议按实际情况进行添加</p>
						</div>
					</ElFormItem>
				</el-form>
			</div>
			<logger ref="logger"/>
		</div>
	</div>
</template>
