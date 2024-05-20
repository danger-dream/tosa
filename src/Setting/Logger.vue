<script setup lang="ts">
import { ref } from 'vue'
import { date_format } from '../Utils.ts'

const logs = ref<{ type: string, msg: string, time: string }[]>([])
const colors = {
	INFO: 'var(--placeholder)',
	ERROR: '#F56C6C',
	SUCCESS: '#67C23A'
}

const addLog = (type: string, msg: string) => logs.value.splice(0, 0, {
	type,
	msg,
	time: date_format(new Date(), 'hh:mm:ss')
})
const log = (msg: string) => addLog('INFO', msg)
const error = (msg: string) => addLog('ERROR', msg)
const success = (msg: string) => addLog('SUCCESS', msg)


defineExpose({ log, error, success, clear: () => logs.value = [] })
</script>

<template>
	<div class="flex w-full h-[250px] border-t border-[#DFDFE0]">
		<div class="flex overflow-y-auto h-full w-full text-sm bg-[#f8f8f8]">
			<ul class="flex flex-col w-full p-4">
				<li v-for="(item, i) in logs" :key="i" class="flex w-full my-1"
					:class="(i ? 'mt-1' : '')">
					<div class="w-24" :style="{color:colors[item.type]}">[{{ item.time }}]</div>
					<div class="flex-grow text-wrap w-full" :style="{color:colors[item.type]}">{{ item.msg }}</div>
				</li>
			</ul>
		</div>
	</div>
</template>

<style scoped lang="scss">

</style>