<script setup lang="ts">
import { onMounted, ref, computed, nextTick } from 'vue'
import InputArea from './InputArea.vue'
import IconBtn from '../components/IconBtn.vue'
import { TranslatorStore as store } from './Store'
import { IDictResult, ITransServiceConfig } from '../types'
import 'animate.css'
import { writeClipboardText } from '../Background'

type ITransResult = string | IDictResult
const props = defineProps({
	config: { type: Object, required: true }
})
const expand = ref(false)
const state = ref(false)
const isLoading = ref(false)
const elapsed_time = ref(0)
const config = computed(() => props.config as ITransServiceConfig)
const trans_result = ref<ITransResult>('')

const isText = computed(() => typeof trans_result.value === 'string' || !trans_result.value)
const text = computed(() => isText.value ? trans_result.value as string : '')
const word = computed<IDictResult>(() => {
	return isText.value ? undefined : trans_result.value as IDictResult
})

onMounted(async () => {
	await store.resetSize()
	if (store.text.value) {
		translate().catch(() => {})
	}
})

function toggleExpand() {
	expand.value = !expand.value
	store.resetSize()
}

function playAudio(url: string) {
	try {
		(new Audio(url)).play()
	} catch {}
}

function onCopy() {
	let x = text.value ?? word.value?.text
	if (!x) return
	writeClipboardText(x)
}

async function onClear(){
	if (isLoading.value) return
	elapsed_time.value = 0
	state.value = false
	trans_result.value = ''
	expand.value = false
	await nextTick()
	await store.resetSize()
}

async function onReTranslate(){
	await onClear()
	translate(false).catch(() => {})
}

async function translate(cache = true): Promise<{ id: string, data: ITransResult }> {
	const group_id = store.gorupId
	const text = store.text.value
	const from = store.src.value
	const to = store.target.value
	const result: { id: string, data: ITransResult } = { id: config.value.id || '', data: '' }
	const service = config.value.service
	if (isLoading.value) return result
	elapsed_time.value = 0
	isLoading.value = true
	state.value = false
	trans_result.value = ''
	if (!service || !service.Translate || !text.trim()) {
		expand.value = false
		isLoading.value = false
		return result
	}
	const st = Date.now()
	try {
		//  使用重试机制调用翻译服务
		trans_result.value = await store.retryTranslate(group_id, config.value, text, from, to, cache)
		result.data = trans_result.value
		state.value = true
	} catch (e) {
		trans_result.value = e.message
		state.value = false
	}
	elapsed_time.value = Date.now() - st
	isLoading.value = false
	expand.value = true
	await nextTick()
	await store.resetSize()
	return result
}

defineExpose({
	translate,
	clear: onClear
})
</script>

<template>
	<div class="flex flex-col bg-[var(--bg-box)] rounded-lg overflow-hidden">
		<div class="flex justify-between items-center h-[35px] text-[var(--text-color)] cursor-pointer mx-3"
			:class="expand ? 'rounded-t-lg' : 'rounded-lg'" @click="toggleExpand">
			<div class="flex items-center">
				<img :src="config.service.icon" class="mr-2 w-4 h-4" />
				{{ config.label }}
				<svg v-if="isLoading" class="animate-spin ml-2 h-5 w-5 text-[var(--placeholder)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
				</svg>
				<div v-if="elapsed_time > 0" class="text-sm text-[var(--text-color)] ml-2">
					({{ elapsed_time }}ms)
				</div>
			</div>
			<icon-btn icon="expand" :size="12" class="mr-1.5" :class="!expand && 'rotate-180'" @click.prevent.stop="toggleExpand" />
		</div>
		<Transition name="custom-classes"
			enter-active-class="animate__animated animate__bounceIn"
			leave-active-class="animate__animated animate__bounceOut"
			@after-enter="store.resetSize()" @after-leave="store.resetSize()">
			<div v-if="expand" class="flex flex-col overflow-hidden">
				<div v-if="isLoading" class="animate-pulse flex-1 px-2 py-3 ml-2">
					<div class="h-2 bg-slate-200 rounded w-[65%]"></div>
					<div class="h-2 bg-slate-200 rounded w-[85%] mt-2.5"></div>
				</div>
				<template v-else-if="isText">
					<input-area :model-value="text" :rows="1" :max-rows="0" :disabled="true" />
				</template>
				<template v-else>
					<div class="flex flex-col px-3 leading-6 text-[var(--text-color)] select-text">
						<div class="flex items-center mb-1.5 text-base">
							{{ word.text }}
						</div>
						<template v-if="word.pronunciations?.length">
							<div v-for="(p, i) in word.pronunciations" :key="i"
								class="flex items-center mb-1.5">
								<span class="mr-2" v-if="p.region">{{ p.region }}</span>
								<span class="mr-3" v-if="p.symbol">[{{ p.symbol }}]</span>
								<icon-btn v-if="p.voice" icon="volume" :size="14" @click="playAudio(p.voice)" title="播放合成语音" />
							</div>
						</template>
						<template v-if="word.explanations?.length">
							<div v-for="(explanation, i) in word.explanations" :key="i" class="flex mb-3">
							<span v-if="explanation.trait" class="float-left text-sm italic font-normal text-[var(--placeholder)] whitespace-nowrap">
								{{ explanation.trait }}
							</span>
								<span class="ml-6 font-medium">
								{{ explanation.explains.join('；') }}
							</span>
							</div>
						</template>
						<template v-if="word.wfs?.length">
							<div v-for="(wf, i) in word.wfs" :key="i" class="flex items-center">
								<span>{{ wf.name }}:</span>
								<span class="ml-3 text-[var(--primary)]">{{ wf.value }}</span>
							</div>
						</template>
						<template v-if="word.sentence?.length">
							<div class="mb-3 font-bold">例句：</div>
							<div v-for="(s, i) in word.sentence" :key="i" class="flex items-start mb-2">
								<div class="mr-1.5 min-w-4 max-w-12 text-[var(--placeholder)]">
									{{ i + 1 }}.
								</div>
								<div class="flex-grow" v-html="s"></div>
							</div>
						</template>
					</div>
				</template>
				<div class="flex justify-between items-center ml-2 my-1.5">
					<div class="flex items-center">
						<icon-btn icon="duplicate" :size="14" tip="复制" class="rotate-90" @click="onCopy" />
						<icon-btn icon="reload" :size="14" tip="重新翻译" @click="onReTranslate"/>
					</div>
				</div>
			</div>
		</Transition>
	</div>
</template>