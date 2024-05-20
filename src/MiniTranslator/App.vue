<script setup lang="ts">
import {ref, computed, onMounted, nextTick} from 'vue'
import IconBtn from '../components/IconBtn.vue'
import { getSize, setSize } from '../Background'

const isBorder = false
const minRows = 1
const maxRows = 4
const focus = ref(false)
const mouseIn = ref(true)
const input = ref(null)
const value = ref('')
const rowHeight = 24

onMounted(() => {
	resize()
})
let blurTimer = null
document.addEventListener('focus', () => {
	clearTimeout(blurTimer)
	focus.value = true
})
document.addEventListener('blur', () => {
	clearTimeout(blurTimer)
	blurTimer = setTimeout(() => focus.value = false, 2000)
})
let leaveTimer = null
document.addEventListener('mousemove', () => {
	clearTimeout(leaveTimer)
	mouseIn.value = true
})
document.addEventListener('mouseleave', () => {
	clearTimeout(leaveTimer)
	leaveTimer = setTimeout(() => mouseIn.value = false, 2000)
})
const pinup = computed(() => focus.value || mouseIn.value)

function resize(){
	nextTick(async () => {
		input.value.style.height = 'auto'
		const rows = input.value.value.split('\n').length
		let overflow = false
		let height = rowHeight * rows
		if (maxRows && rows > maxRows) {
			overflow = true
			height = (rowHeight * maxRows)
		} else if (rows <= minRows) {
			height = (rowHeight * minRows)
		}
		input.value.style.overflowY = overflow ? 'auto' : 'hidden'
		input.value.style.height = height + 'px'

		const curSize = await getSize()
		height = Math.floor((height + 8 * 2 + 1))
		await setSize(curSize.width, height)
	});

}
</script>

<template>
	<div class="flex flex-col p-[1px] rounded-lg overflow-hidden"
		 data-tauri-drag-region :style="{
			opacity: pinup ? '100%' : '30%',
			width: isBorder ? 'calc(100% - 1px)' : '100%',
			border: isBorder ? '1px solid #ccc' : 'none'
		}" >
		<div class="flex flex-col bg-[#F5F4F6] rounded-lg" data-tauri-drag-region>
			<div class="flex justify-start mx-2 my-2 rounded-lg" data-tauri-drag-region>
				<textarea v-model="value" autocomplete="off" ref="input" placeholder="输入或粘贴文字"
						  class="input-area" :style="{ 'line-height': rowHeight + 'px' }" :class="{ focus }"
						  @focus="focus = true" @blur="focus = false" @input="resize"></textarea>
				<div v-if="!focus" class="ml-2">
					<icon-btn icon="pinup" :size="16" :style="{ 'line-height': rowHeight + 'px', height: rowHeight + 'px' }"/>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.input-area {
	@apply flex-grow w-full border-none rounded-lg px-3 py-0 text-[var(--text-color)]
	bg-white resize-none overflow-y-auto select-text outline-none
	hover:outline-none active:outline-none placeholder-[var(--placeholder)];
	transition: height 0.5s ease;
}

.input-area.focus {
	transition: width 0.3s ease;
}

.fade-transition-enter-active, .fade-transition-leave-active {
	transition: opacity .5s;
}
.fade-transition-enter, .fade-transition-leave-to /* .leave-to 在 >=2.1.8 版本中 */ {
	opacity: 0;
}
</style>
