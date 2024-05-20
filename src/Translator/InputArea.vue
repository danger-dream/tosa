<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue'

const props = defineProps({
	modelValue: { type: String, default: '' },
	placeholder: { type: String, default: '' },
	rows: { type: Number, default: 3 },
	maxRows: { type: Number, default: 10 },
	disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'enter'])

const rowHeight = 22
const input = ref(null)
const hiddenDiv = ref(null)
const value = ref("")
const attrs = computed(() => {
	if (props.disabled) {
		return {
			disabled: 'disabled',
			placeholder: props.placeholder
		}
	}
	return { placeholder: props.placeholder }
})
function resize() {
	nextTick().then(() => {
		const textareaStyle = window.getComputedStyle(input.value)
		// 将 textarea 的样式应用到 hiddenDiv 上
		hiddenDiv.value.style.width = textareaStyle.width
		hiddenDiv.value.style.padding = textareaStyle.padding
		hiddenDiv.value.style.borderWidth = textareaStyle.borderWidth
		// 设置 hiddenDiv 的内容为当前输入框内容，并设置白色空格处理以模拟真实情况
		hiddenDiv.value.textContent = value.value + '\n'
		const heightNeeded = hiddenDiv.value.scrollHeight

		const rowsCountedByHeight = Math.floor(heightNeeded / rowHeight)
		let height
		if (props.maxRows && rowsCountedByHeight > props.maxRows) {
			height = rowHeight * props.maxRows
			input.value.style.overflowY = "auto"
		} else if (rowsCountedByHeight <= props.rows) {
			height = rowHeight * props.rows
			input.value.style.overflowY = "hidden"
		} else {
			height = heightNeeded;
			input.value.style.overflowY = "hidden"
		}
		input.value.style.height = `${height}px`
	})
}

onMounted(() => {
	value.value = props.modelValue
	resize()
})

watch(() => props.modelValue, (val) => {
	value.value = val
})

watch(() => value.value, (val) => {
	emit('update:modelValue', val)
	resize()
})

function onEnter(e: KeyboardEvent) {
	if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
		e.stopPropagation()
		e.preventDefault()
		emit('enter')
	}
}

defineExpose({
	focus: () => input.value?.focus()
})
</script>

<template>
	<div class="flex">
		<textarea v-model="value" autocomplete="off" ref="input" v-bind="attrs" @keydown.enter="onEnter"
			class="input-area w-full border-none rounded-lg px-3 py-0 text-[var(--text-color)] leading-6
			bg-[var(--bg-box)] resize-none overflow-y-auto select-text outline-none
			hover:outline-none active:outline-none placeholder-[var(--placeholder)]"></textarea>
		<!-- 隐藏 div 用于计算高度 -->
		<div ref="hiddenDiv" style="visibility:hidden;white-space : pre-wrap;word-wrap : break-word;position : absolute;top : -9999px;"></div>
	</div>
</template>