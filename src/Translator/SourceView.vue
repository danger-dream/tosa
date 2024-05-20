<script setup lang="ts">
import {listen, once, writeClipboardText, showMenu} from '../Background'
import { ref } from 'vue'
import InputArea from './InputArea.vue'
import IconBtn from '../components/IconBtn.vue'
import { configuration } from '../Configuration.ts'
import {TranslatorStore as store} from './Store'
import { LanguageList, LanguageZh } from '../Plugins/Translator'

const reverse = ref<string>('')
const src = ref<InstanceType<typeof InputArea>>(null)

listen('translator://focus', async function() {
	if (configuration.auto_clear) {
		await store.clear()
	}
	src.value?.focus()
})

listen('translator://focus/no-clear', () => src.value?.focus())

function onSelectLang(e: MouseEvent, target: 'src' | 'target') {
	e.preventDefault()
	reverse.value = target
	const val = store[target].value

	once('menu-did-close', () => reverse.value = '')
	const rect = (e.target as Element).getBoundingClientRect()
	showMenu({
		position: {
			x: rect.left + window.scrollX,
			y: rect.top + window.scrollY + rect.height + 5
		},
		items: LanguageList.map(x => ({
			label: LanguageZh[x], checked: x === val, payload: { target, lang: x }
		})).filter(x => !(x.payload.target === 'target' && x.payload.lang === 'auto') && x.label) as any
	}, function(payload: { target: 'src' | 'target', lang: string }) {
		store[payload.target].value = payload.lang
	})
}
</script>

<template>
	<div class="flex flex-col mx-3.5 pt-3 rounded-lg bg-[--bg-box]">
		<input-area ref="src" v-model="store.text.value" placeholder="请输入待翻译的内容。Enter 翻译、Shitf + Enter 换行。"
					@enter="store.translate()"/>
		<div class="flex justify-between items-center mx-3 my-1.5">
			<div class="flex items-center">
				<icon-btn icon="duplicate" :size="14" tip="复制" class="rotate-90"
						  @click="writeClipboardText(store.text.value)" />
				<icon-btn icon="clear" :size="14" tip="清空" @click="store.clear()" />
				<div v-if="store.isDetecting.value" class="text-[var(--placeholder)] text-sm ml-2.5 px-2 py-0.5 rounded-2xl bg-[var(--bg1)]">
					识别中...
				</div>
				<div v-else-if="store.detect_language.value" class="text-[var(--placeholder)] text-sm ml-2.5 px-2 py-0.5 rounded-2xl bg-[var(--bg1)]">
					识别为
					<mark class="ml-0.5 text-[var(--primary)] bg-[var(--bg1)]">
						{{ LanguageZh[store.detect_language.value] }}
					</mark>
				</div>
			</div>
		</div>
	</div>
	<div class="flex items-center bg-[var(--bg2)] mx-3.5 my-2 rounded-lg h-[35px]">
		<div class="flex justify-center items-center w-[40%] grow">
			<div class="cursor-pointer hover:underline" @click="e => onSelectLang(e, 'src')" title="原语种">
				{{ LanguageZh[store.src.value] }}
			</div>
			<svg-icon icon="expand-1" :size="12" class="ml-1" :class="reverse === 'src' ? '' : 'rotate-180'" />
		</div>
		<icon-btn icon="exchange" tip="互换语种" />
		<div class="flex justify-center items-center w-[40%] grow">
			<div class="cursor-pointer hover:underline" @click="e => onSelectLang(e, 'target')" title="目标语种">
				{{ LanguageZh[store.target.value] }}
			</div>
			<svg-icon icon="expand-1" :size="12" class="ml-1" :class="reverse === 'target' ? '' : 'rotate-180'" />
		</div>
	</div>
</template>