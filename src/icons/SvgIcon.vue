<template>
	<svg aria-hidden="true" class="svg-icon focus:outline-none" :width="props.size" :height="props.size" :color="props.color">
		<use :xlink:href="symbolId"/>
	</svg>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
	icon: {
		type: String,
		required: true
	},
	color: {
		type: String,
		default: '#666'
	},
	size: {
		type: Number,
		default: 18
	}
})

const symbolId = computed(() => `#icon-${props.icon}`)
</script>