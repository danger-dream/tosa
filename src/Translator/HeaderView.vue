<script setup lang="ts">
import IconBtn from '../components/IconBtn.vue'
import { configuration as conf } from '../Configuration.ts'
import { invoke } from '../Background'

</script>

<template>
	<div class="flex justify-between items-center mx-4 my-1.5" data-tauri-drag-region>
		<icon-btn icon="pinup" tip="钉住窗口，不会因为失去焦点而隐藏窗口"
			:active="conf.pinup" @click="() => conf.pinup = !conf.pinup"/>
		<div class="flex items-center">
			<icon-btn icon="clipboard" tip="自动复制文本翻译、图片识别结果到剪切板"
				:active="conf.auto_copy"
				@click="conf.auto_copy = !conf.auto_copy"/>
			<icon-btn icon="dict" tip="仅使用词典翻译服务"
				:active="conf.only_dict"
				@click="conf.only_dict = !conf.only_dict"/>
			<icon-btn icon="setting" tip="设置" @click="invoke('show_setting_window')"/>
		</div>
	</div>
</template>
