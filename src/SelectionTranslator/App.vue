<script setup lang="ts">
import {ref,reactive,nextTick} from 'vue'
import { IBaseSelectionTranslator } from '../types'
import { configuration as conf } from '../Configuration'
import { plugins } from '../Plugins/Selection'
import { isVisible, listen, setAlwaysOnTop, setPosition, setSize, showWindow, hideWindow as hideWin } from '../Background'

const box = ref<HTMLDivElement>()
const state = reactive({
	selectedText: '',
	actions: [] as IBaseSelectionTranslator[]
})
const size = {width: 20, height: 20, spacing: 4, padding: 4, box_padding: 4}

let isMouseInner = false
let isHideEvent = false

listen('selection://mouse-selected_text', async function(e) {
	if (!e || !box.value) return
	if (!conf.enable_selection_assistant || !conf.assistants.length) return
	const {x,y,text} = e as { x: number, y: number, text: string }
	state.selectedText = text
	const actions:IBaseSelectionTranslator[] = []
	for (const k of conf.assistants) {
		const plugin = plugins.find(x => x.name === k)
		if (!plugin) continue
		try {
			if (await plugin.Verify(text)) {
				actions.push(plugin)
			}
		} catch {}
	}
	if (!actions.length) {
		return
	}
	state.actions = actions
	isHideEvent = false
	isMouseInner = false
	await nextTick()
	let width = (
		(size.width + size.padding * 2) * actions.length) +
		((actions.length -1) * size.spacing) +
		size.box_padding
	width = Math.floor(width)

	let height = size.height + size.padding * 2 + size.box_padding * 2
	height = Math.floor(height)
	await setSize(width, height)
	if (!await isVisible()) {
		await showWindow()
	}
	await setAlwaysOnTop(true)
	await setPosition(Math.floor(x - width / 2), y + 15)
	hideWindow()
})

let timer: NodeJS.Timeout
function hideWindow() {
	if (!conf.assistant_hide_timer) {
		return
	}
	clearTimeout(timer)
	timer = setTimeout(() => {
		if (isMouseInner) return
		hideWin()
	}, conf.assistant_hide_timer)
}

listen('selection://hide-window', function() {
	//	触发隐藏事件时，鼠标在窗口内时不隐藏
	if (isMouseInner) {
		isHideEvent = true
	} else {
		hideWin()
	}
})

function blurEvent() {
	isMouseInner = false
	if (isHideEvent) {
		hideWin()
	} else {
		hideWindow()
	}
}
document.addEventListener('mousemove', () => isMouseInner = true)
document.addEventListener('mouseleave', blurEvent)
document.addEventListener('blur', blurEvent)

function invokeAction(item: IBaseSelectionTranslator) {
	item.Invoke(state.selectedText)
	hideWin()
}

</script>

<template>
	<div class="overflow-hidden bg-[#efefef]" :style="{ padding: size.box_padding + 'px' }">
		<div class="flex items-center space-x-1" ref="box">
			<div v-for="item in state.actions" :key="item.name" class="rounded-lg hover:bg-[#D7D9DC] active:bg-[#b3b3b3]"
				 :style="{ padding: size.padding + 'px' }" @click="invokeAction(item)">
				<img :src="`/icon/${ item.icon }.svg`" :style="{ height: size.height + 'px', width: size.width + 'px' }"/>
			</div>
		</div>
	</div>

</template>
