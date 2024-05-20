<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import HeaderView from './HeaderView.vue'
import SourceView from './SourceView.vue'
import TargetView from './TargetView.vue'
import { configuration as conf, generateTransConfig } from '../Configuration.ts'
import { TranslatorStore as store } from './Store'

const upBtn = ref(false)
const downBtn = ref(false)
const targetEl = ref<HTMLDivElement>(null)
const transServices = computed(() => conf.trans_services.map(x => generateTransConfig(x)).filter(Boolean))

onMounted(() => store.resetSize())

function checkScrollHeight() {
	const el = targetEl?.value
	if (!el) {
		return
	}
	downBtn.value = el.scrollTop + el.offsetHeight + 10 < el.scrollHeight
	upBtn.value = el.scrollTop > 20
}

store.checkScrollHeight = checkScrollHeight
</script>

<template>
	<div class="flex flex-col p-[1px] bg-[#ccc] rounded-lg" style="width: calc(100% - 1px)">
		<div class="flex flex-col bg-[var(--bg)] rounded-lg">
			<header-view />
			<source-view />
			<div class="relative">
				<div class="max-h-[600px] overflow-y-auto rounded-lg mx-3.5 mb-3.5 hide-scrollbar relative" @scroll="checkScrollHeight"
					ref="targetEl">
					<target-view v-for="(item, index) in transServices" :key="item.id || index"
						:config="item" :ref="(target: any) => store.serviceEl.set(item.id || item.name, target)"
						:class="{ 'mt-2': index > 0 }" />

				</div>
				<div v-if="upBtn" class="absolute top-0 left-0 w-full h-[30px] bg-[#F3F3F3]/95">
					<div class="flex justify-center items-center">
						<svg-icon icon="direction-down" :size="30" color="var(--placeholder)" class="rotate-180"></svg-icon>
					</div>
				</div>
				<div v-if="downBtn" class="absolute bottom-0 left-0 right-0 h-[30px] backdrop-opacity-5 backdrop-invert bg-[#F3F3F3]/80">
					<div class="flex justify-center items-center">
						<svg-icon icon="direction-down" :size="30" color="var(--placeholder)"></svg-icon>
					</div>
				</div>
			</div>

		</div>
	</div>
</template>
