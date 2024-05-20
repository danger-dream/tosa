<script setup lang="ts">
import { ref, onMounted, shallowRef, nextTick } from 'vue'
import ServiceView from './Service.vue'
import General from './General.vue'
import Selection from './Selection.vue'
import Autohotkey from './Autohotkey.vue'
import './style.css'
import { closeWindow, setTitle } from '../Background'

interface IMenu {
	name: string
	label: string
	icon?: string
	size?: number
	explain?: string
	component?: any
}

const active = ref('')
const menus = ref<IMenu[]>([
	{
		name: 'general',
		label: '通用设置',
		icon: 'setting-solid',
		explain: '程序中主要功能的设置，包括：快捷键设置、文本处理、自动复制、缓存设置、备份/恢复',
		component: shallowRef(General)
	},
	{
		name: 'service',
		label: '服务配置',
		icon: 'cloud',
		explain: '文本翻译、图片识别功能的接口服务配置，下方开启的服务将被使用',
		component: shallowRef(ServiceView)
	},
	{
		name: 'history',
		label: '历史记录',
		explain: '查看当前文本翻译、OCR识别、划词的历史记录'
	},
	{
		name: 'selection',
		label: '划词助手',
		explain: '查看当前文本翻译、OCR识别、划词的历史记录',
		component: shallowRef(Selection)
	},
	{
		name: 'autohotkey',
		label: 'AutoHotKey',
		explain: 'Autohotkey在本程序中主要被用于将windows功能键重映射为macos键序。',
		component: shallowRef(Autohotkey)
	}
])
const activeMenu = ref<IMenu>(null)

onMounted(() => {
	onActive(menus.value[0])
})

function onActive(item: IMenu) {
	activeMenu.value = null
	setTitle('设置 - ' + item.label)
	nextTick(() => {
		active.value = item.name
		activeMenu.value = item
	})
}
</script>

<template>
	<div class="h-full p-[1px] bg-[var(--bc)] relative">
		<!-- close button -->
		<div class="absolute right-0 top-0 z-40 px-4 py-2 hover:bg-[#c42b1c] group" @click="closeWindow()">
			<svg-icon icon="close" :size="14" class="cursor-pointer group-hover:text-white" />
		</div>

		<!-- menus sider -->
		<aside data-tauri-drag-region
			class="w-[210px] inline-block relative box-border flex-shrink-0 cursor-default p-4 h-full float-left text-[var(--n-text-color)] bg-[#DFDFE0]">
			<div class="flex justify-center my-9" data-tauri-drag-region>
				<div class="w-[80px]" data-tauri-drag-region>
					<img src="/icon.png" data-tauri-drag-region />
				</div>
			</div>
			<div class="w-full relative space-y-1" data-tauri-drag-region>
				<div v-for="item in menus" :key="item.label"
					class="flex items-center justify-start flex-nowrap rounded-md h-[36px] px-2 hover:bg-[var(--bc)] active:bg-[var(--bc)]"
					:class="item.name === active ? 'hover:bg-[var(--primary)] bg-[var(--primary)] text-white' : ''"
					@click="onActive(item)">
					<svg-icon :icon="item.icon || item.name" :size="item.size || 20"
						:color="item.name === active ? '#fff' : '#919191'" />
					<div class="ml-3">{{ item.label }}</div>
				</div>
			</div>
		</aside>
		<!-- active menu container -->
		<Transition name="custom-classes" style="--animate-duration: 0.8s"
			enter-active-class="animate__animated animate__backInRight">
			<div v-if="activeMenu" style="width: calc(100% - 210px)"
				class="float-left h-full bg-[#E4E4E4] overflow-hidden">
				<!-- is show header -->
				<template v-if="activeMenu.explain">
					<div class="flex flex-col bg-[#E4E4E4] p-5 h-[100px]" data-tauri-drag-region>
						<div class="text-xl font-bold my-2" data-tauri-drag-region>{{ activeMenu.label }}</div>
						<div class="text-[#777777]" data-tauri-drag-region>{{ activeMenu.explain }}</div>
					</div>
					<div class="bg-[#F0F2F1]" style="height: calc(100% - 100px)">
						<component :is="activeMenu.component" />
					</div>
				</template>
				<div v-else class="h-full">
					<component :is="activeMenu.component" />
				</div>
			</div>
		</Transition>
	</div>
</template>
