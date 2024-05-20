<script setup lang="ts">
import { invoke, listen } from '../Background'
import { reactive, onMounted, onUnmounted, ref } from 'vue'
import { ElCheckbox } from 'element-plus'
import { VAceEditor } from 'vue3-ace-editor'
import ace from 'ace-builds'
import modeAutohotkeyUrl from 'ace-builds/src-noconflict/mode-autohotkey?url'
import themeGithubUrl from 'ace-builds/src-noconflict/theme-github?url'
import workerBaseUrl from 'ace-builds/src-noconflict/worker-base?url';
import snippetsJsonUrl from 'ace-builds/src-noconflict/snippets/autohotkey?url';
import { configuration as conf } from '../Configuration.ts'
import 'ace-builds/src-noconflict/ext-language_tools';
import 'element-plus/es/components/checkbox/style/css'
import 'element-plus/es/components/badge/style/css'
import Logger from './Logger.vue'

ace.config.setModuleUrl('ace/mode/base', workerBaseUrl);
ace.config.setModuleUrl('ace/mode/autohotkey', modeAutohotkeyUrl)
ace.config.setModuleUrl('ace/theme/github', themeGithubUrl)
ace.config.setModuleUrl('ace/snippets/autohotkey', snippetsJsonUrl);
ace.require("ace/ext/language_tools");

const logger = ref<InstanceType<typeof Logger>>(null)
const state = reactive({
	running: false,
	lang: 'autohotkey',
	theme: 'github',
	content: '',
	options: {
		useWorker: true,
		enableBasicAutocompletion: true,
		enableSnippets: true,
		enableLiveAutocompletion: true,
		fontSize: '12px',
	}
})


let timeout: NodeJS.Timeout | null = null
let unlisten: any = null
onMounted(async () => {
	unlisten = await listen('ahk://event', handleEvent)
	await reloadScript()
	timeout = setInterval(async function() {
		try {
			state.running = await invoke<boolean>('is_autohotkey_running')
		} catch {}
	}, 1000)
})

onUnmounted(() => {
	if (unlisten) {
		try {
			unlisten()
		}catch {}
	}
	if (timeout) {
		clearInterval(timeout)
		timeout = null
	}
})

function handleEvent(e: any) {
	logger.value?.log(e['payload'])
}

async function reloadScript() {
	try {
		state.content = await invoke('read_script')
		logger.value?.success('脚本加载成功')
	} catch (e) {
		logger.value?.error('加载脚本失败: ' + (e?.message || e))
		state.content = ''
	}
}

async function saveScript() {
	if (!state.content) {
		logger.value?.log('脚本内容为空，跳过保存')
		return
	}
	try {
		if (await invoke<boolean>('write_script', { script: state.content })) {
			logger.value?.success('脚本保存成功')
		} else {
			logger.value?.error('脚本保存失败')
		}
	} catch (e) {
		logger.value?.error('脚本保存失败: ' + (e?.message || e))
	}
}

async function toggleRunningState() {
	if (state.running) {
		try {
			await invoke<any>('kill_autohotkey')
			logger.value?.success('脚本已停止')
			state.running = false
		} catch (e) {
			logger.value?.error('停止脚本失败: ' + (e?.message || e))
		}
	} else {
		try {
			if (await invoke<boolean>('start_autohotkey')) {
				state.running = true
				logger.value?.success('脚本已运行')
			} else {
				logger.value?.error('运行脚本失败')
			}
		} catch (e) {
			logger.value?.error('运行脚本失败: ' + (e?.message || e))
		}
	}
}
</script>

<template>
	<div class="flex flex-col h-full">
		<div class="flex justify-between items-center m-1 font-medium text-base text-center px-4">
			<ElCheckbox v-model="conf.enable_ahk">启用Autohotkey功能</ElCheckbox>
			<div class="flex items-center">
				<button class="btn" style="margin-left: 8px" @click.stop.prevent="saveScript">保存脚本</button>
				<button class="btn" style="margin-left: 8px" @click.stop.prevent="reloadScript">重载脚本</button>
				<button class="btn" style="margin-left: 8px" @click.stop.prevent="toggleRunningState">
					{{ state.running ? '停止脚本' : '运行脚本' }}
				</button>
				<template v-if="state.running">
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
		</div>
		<VAceEditor v-model:value="state.content" :lang="state.lang" :theme="state.theme" :options="state.options"
			class="flex flex-grow text-lg w-full border border-[#e4e7eb]" />
		<logger ref="logger"/>
	</div>
</template>

<style scoped lang="scss">
</style>
