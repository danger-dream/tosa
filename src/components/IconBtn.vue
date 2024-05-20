<script setup lang="ts">
import { computed } from 'vue'
import { ElTooltip } from 'element-plus'

const props = defineProps({
	tip: { type: String, default: '' },
	icon: { type: String, required: true },
	rotate: { type: String, default: '' },
	active: { type: Boolean, default: false },
	size: { type: Number, default: 18 }
});
const emit = defineEmits(['click'])

const icon = computed<any>(() => props.icon)
const tip = computed(() => props.tip)
const active = computed(() => props.active)
const color = computed(() => active.value ? 'var(--primary)' : '#787A7F')
</script>

<template>
	<div class="btn p-1 rounded-lg flex items-center cursor-pointer hover:bg-[var(--hover)] active:bg-[var(--active)] focus-visible:outline-none"
		@click="e => emit('click', e)" :class="active ? 'active' : ''">
		<template v-if="tip">
			<el-tooltip effect="dark" :content="tip" placement="bottom" :hide-after="1" :show-after="200">
				<svg-icon :icon="icon" :size="props.size" :color="color" />
			</el-tooltip>
		</template>
		<template v-else>
			<svg-icon :icon="icon" :size="props.size" :color="color" />
		</template>
	</div>
</template>

<style scoped lang="scss">
.btn + .btn {margin-left: 5px;}
</style>