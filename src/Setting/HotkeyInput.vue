<script setup lang="ts">
import { isRegisteredGlobalShortcut, messageBox } from '../Background'
import { ref, computed, watch, onMounted } from 'vue'

const CODE_NUMBER = Array.from({ length: 10 }, (_, k) => `Digit${k + 1}`)
const CODE_NUMPAD = Array.from({ length: 10 }, (_, k) => `Numpad${k + 1}`)
const CODE_ABC = Array.from({ length: 26 }, (_, k) => `Key${String.fromCharCode(k + 65).toUpperCase()}`)
const CODE_FN = Array.from({ length: 12 }, (_, k) => `F${k + 1}`)
const CODE_CONTROL = [
	'Shift', 'ShiftLeft', 'ShiftRight',
	'Control', 'ControlLeft', 'ControlRight',
	'Alt', 'AltLeft', 'AltRight'
]
const keyRange = [...CODE_NUMBER, ...CODE_NUMPAD, ...CODE_ABC, ...CODE_FN]

const props = defineProps({
	modelValue: { type: String, required: true },
	valid: { type: Function, default: () => true }
})
const emit = defineEmits(['update:modelValue'])

interface IHotkey {
	ctrl: boolean
	alt: boolean
	shift: boolean
	key: string
	str: string
}

const hotkey = ref<IHotkey>(null)

watch(() => props.modelValue, (val) => {
	handleHotkey(val)
})

const isChange = computed(() => {
	return (hotkey.value?.str?.toUpperCase() || '') !== props.modelValue?.toUpperCase()
})

onMounted(() => {
	handleHotkey(props.modelValue)
})

function build(ctrl: boolean, alt: boolean, shift: boolean, key: string) {
	const cur: IHotkey = { ctrl, alt, shift, key: key.toUpperCase(), str: '' }
	let list = []
	for (const { key, text } of [
		{ key: ctrl, text: 'Ctrl' },
		{ key: alt, text: 'Alt' },
		{ key: shift, text: 'Shift' }
	]) {
		key && list.push(text)
	}
	key && list.push(key.toUpperCase())
	cur.str = list.join('+')
	hotkey.value = cur
}

function handleHotkey(val: string) {
	if (!val.length) {
		hotkey.value = null
		return
	}
	const arr = val.split('+').map((x) => x.trim())
	const ctrlKeys = arr.map((x) => x.toLowerCase())
	build(
		ctrlKeys.includes('ctrl'),
		ctrlKeys.includes('alt'),
		ctrlKeys.includes('shift'),
		arr[arr.length - 1]
	)
}

function handleKeydown(e: KeyboardEvent) {
	const { altKey, ctrlKey, shiftKey, key, code } = e
	e.preventDefault()
	if (!altKey && !ctrlKey && !shiftKey) {
		return
	}
	if (!CODE_CONTROL.includes(key) && keyRange.includes(code)) {
		build(ctrlKey, altKey, shiftKey, key)
	}
}

function onUpdate() {
	const key = hotkey.value?.str
	if (!key) {
		console.log('clear hotkey')
		emit('update:modelValue', '')
		return
	}
	isRegisteredGlobalShortcut(key).then(function(res) {
		if (res) {
			handleHotkey(props.modelValue)
			messageBox('热键已被其他程序占用', { title: '错误' })
		} else {
			emit('update:modelValue', key)
		}
	})
}
</script>

<template>
	<div class="flex items-center">
		<div tabindex="0" @keydown="handleKeydown" class="flex justify-between items-center p-2 rounded-md bg-white
			shadow-[0_0_0_1px_var(--bg3)_inset] cursor-text transition w-[250px] h-[34px]
			focus:shadow-[0_0_0_1px_var(--primary)_inset] outline-none">
			<div class="flex items-center text-sm ml-1 text-[var(--placeholder)] font-bold">
				<span class="px-1 rounded" :class="hotkey?.ctrl && 'text-[var(--primary)]'">CTRL</span>
				<span class="px-1 rounded ml-1" :class="hotkey?.alt && 'text-[var(--primary)]'">ALT</span>
				<span class="px-1 rounded ml-1" :class="hotkey?.shift && 'text-[var(--primary)]'">SHIFT</span>
				<span v-if="hotkey?.key" class="text-[var(--primary)] px-1 rounded ml-1">
					{{ hotkey.key }}
				</span>
			</div>
			<i class="content-none bg-contain w-5 h-5 scale-90 opacity-60 hover:cursor-pointer hover:opacity-100 close"
			   v-if="hotkey?.key" @click="hotkey = null" />
		</div>
		<div class="flex items-center m-1 text-sm ml-1" v-if="isChange">
			<button class="btn" style="padding: 2px 5px" @click.stop.prevent="handleHotkey(modelValue)">取消</button>
			<button class="btn" style="padding: 2px 5px; margin-left: 2px;" @click.stop.prevent="onUpdate">更新</button>
		</div>
	</div>
</template>

<style scoped>
.close {
	background: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' %3E%3Cpath d='M512 64C264.58 64 64 264.58 64 512s200.58 448 448 448 448-200.58 448-448S759.42 64 512 64zm0 832c-212.08 0-384-171.92-384-384s171.92-384 384-384 384 171.92 384 384-171.92 384-384 384z' fill='%23909399'/%3E%3Cpath d='M625.14 353.61L512 466.75 398.86 353.61a32 32 0 0 0-45.25 45.25L466.75 512 353.61 625.14a32 32 0 0 0 45.25 45.25L512 557.25l113.14 113.14a32 32 0 0 0 45.25-45.25L557.25 512l113.14-113.14a32 32 0 0 0-45.25-45.25z' fill='%23909399'/%3E%3C/svg%3E") no-repeat center;
}
</style>
