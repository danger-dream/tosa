<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { ElForm, ElFormItem, ElInputNumber, ElCheckbox, ElSelect, ElOption, ElOptionGroup, ElDivider } from 'element-plus'
import { configuration as conf, generateTransConfig } from '../Configuration'
import HotkeyInput from './HotkeyInput.vue'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/form-item/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/input-number/style/css'
import 'element-plus/es/components/checkbox/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/option-group/style/css'
import 'element-plus/es/components/divider/style/css'
import { LanguageList, LanguageZh } from '../Plugins/Translator'
import { isAutostart, setAutostart } from '../Background'

const isAutoStart = ref(false)
const trans = computed(() => conf.trans_services.map(generateTransConfig).filter(x => x?.service?.Translate))
const detects = computed(() => conf.trans_services.map(generateTransConfig).filter(x => x?.service?.Detect))


onMounted(() => {
	isAutostart().then(res => {
		isAutoStart.value = res
	})
})

async function onToggleAutoStart(v) {
	if (v) {
		try {
			await setAutostart(true)
		} catch {
			isAutoStart.value = false
		}
	} else {
		try {
			await setAutostart(false)
		} catch {
			isAutoStart.value = true
		}
	}
}
</script>

<template>
	<div class="w-full h-full p-5 overflow-y-auto">
		<el-form label-width="250px" class="m-5">
			<ElFormItem>
				<ElCheckbox v-model="isAutoStart" @change="onToggleAutoStart">开机自启动</ElCheckbox>
			</ElFormItem>
			<div class="text-[#a1a1a1] text-wrap mt-1 ml-[250px] mb-4 leading-4">
				快捷键必须包含Ctrl、Alt、Shift中的至少一个，且不能与其他软件冲突。
			</div>
			<el-form-item label="显示翻译窗口:">
				<HotkeyInput v-model="conf.show_translator"/>
				<ElCheckbox v-model="conf.auto_clear">显示时是否清空上次翻译内容</ElCheckbox>
			</el-form-item>
			<el-form-item label="截图翻译:">
				<HotkeyInput v-model="conf.screenshot_translate"/>
			</el-form-item>
			<el-form-item label="划词翻译:">
				<HotkeyInput v-model="conf.selection_translate"/>
			</el-form-item>
			<el-form-item label="截图识别:">
				<HotkeyInput v-model="conf.screenshot_recognizer"/>
				<div class="item-tip">
					仅截图后识别文本内容，不进行翻译。
				</div>
			</el-form-item>
			<el-form-item label="翻译窗口位置">
				<ElSelect v-model="conf.win_position" placeholder="请选择翻译窗口的位置" style="width: 250px">
					<ElOption label="屏幕右上角" value="right-top"/>
					<ElOption label="屏幕中间" value="center"/>
					<ElOption label="鼠标位置" value="mouse"/>
					<ElOption label="上次的位置" value="last"/>
				</ElSelect>
			</el-form-item>

			<el-divider/>
			<el-form-item label="词典模式">
				<ElCheckbox v-model="conf.only_dict">仅使用词典翻译服务</ElCheckbox>
				<div class="item-tip">
					开启后，仅显示带词典翻译的服务，若翻译失败将回退至文本翻译。
				</div>
			</el-form-item>
			<el-form-item label="语种识别类型">
				<ElSelect v-model="conf.detect_type" placeholder="请选择语种识别类型" style="width: 250px">
					<ElOptionGroup label="按规则">
						<ElOption label="本地服务" value="local"/>
						<ElOption label="顺序执行" value="order"/>
						<ElOption label="并发最快（建议）" value="concurrent"/>
						<ElOption label="并发最多" value="concurrent_most"/>
					</ElOptionGroup>
					<ElOptionGroup label="按服务">
						<ElOption v-for="item in detects"
							:key="item.id" :label="item.label" :value="item.id"/>
					</ElOptionGroup>
				</ElSelect>
				<div class="item-tip">
					<p>仅在语种为「自动检测」时才启用</p>
					<p>本地服务：仅使用本地语种识别：识别率有限。</p>
					<p>顺序执行：按照翻译服务的顺序依次调用可用的语种识别服务，直到识别成功为止。</p>
					<p>并发最快：同时调用可用的语种识别服务，并使用最先返回的成功识别结果。</p>
					<p>并发最多：同时调用可用的语种识别服务，使用最多返回的结果，该选项最准确，但最慢。</p>
					<p>若所有服务都失败，则使用本地语种识别。</p>
				</div>
			</el-form-item>
			<el-form-item label="默认的目标语种">
				<ElSelect v-model="conf.to" placeholder="请选择默认的目标语种" style="width: 250px">
					<ElOption v-for="x in LanguageList" :label="LanguageZh[x]" :value="x"/>
				</ElSelect>
			</el-form-item>
			<el-form-item label="第二目标语种">
				<ElSelect v-model="conf.to2" placeholder="请选择第二目标语种" style="width: 250px">
					<ElOption v-for="x in LanguageList" :label="LanguageZh[x]" :value="x"/>
				</ElSelect>
				<div class="item-tip">
					<p>当检测到原文语种与目标语种相同时使用的语种。</p>
					<p>若不设置则自动选择首个与原文语种的不同的语种。</p>
				</div>
			</el-form-item>

			<el-form-item label="翻译服务超时时间">
				<el-input-number v-model="conf.trans_timeout" controls-position="right"
					:min="0" :max="60*1000*3" :step="100"/>
				<div class="item-tip">
					默认的调用超时时间，单位：毫秒，1秒等于1000毫秒，可在文本翻译服务配置时单独设置。
				</div>
			</el-form-item>
			<el-form-item label="错误重试次数">
				<el-input-number v-model="conf.trans_retry_count" controls-position="right"
					:min="0" :max="10"/>
				<div class="item-tip">
					调用服务超时或错误时，重试的次数，可在文本翻译服务配置时单独设置。
				</div>
			</el-form-item>
			<el-divider></el-divider>

			<el-form-item label="图片识别方式">
				<ElSelect v-model="conf.ocr_type" placeholder="请选择识别方式" style="width: 250px">
					<ElOption label="按服务顺序" value="round"/>
					<ElOption label="并发调用" value="concurrent"/>
					<ElOption label="随机调用" value="random"/>
					<ElOption label="使用首个服务" value="first"/>
				</ElSelect>
				<div class="item-tip">
					<p>按服务顺序：按照服务的顺序依次调用可用的图片识别服务，直到识别成功为止。</p>
					<p>并发调用：同时调用可用的图片识别服务，并使用最先返回的识别结果。</p>
					<p>随机调用：随机调用可用的图片识别服务，直到识别成功为止。</p>
				</div>
				<ElCheckbox v-model="conf.ocr_succed_show_win">图片识别成功才显示翻译窗口</ElCheckbox>
				<div class="item-tip">
					<p>开启后，只有当图片识别成功时，才会显示翻译窗口。</p>
					<p>若不开启，将在截图完成后立即显示翻译窗口。</p>
				</div>
				<ElCheckbox v-model="conf.ocr_err_tip">图片识别错误提示</ElCheckbox>
				<div class="item-tip">开启后，图片翻译失败时会弹框提示错误原因</div>
			</el-form-item>
			<el-form-item label="图片识别超时时间">
				<el-input-number v-model="conf.ocr_timeout" controls-position="right"
								 :min="0" :max="60*1000*3" :step="100"/>
				<div class="item-tip">
					默认的调用超时时间，单位：毫秒，1秒等于1000毫秒，可在图片识别服务配置时单独设置超时时间。
				</div>
			</el-form-item>
			<el-form-item label="错误重试次数">
				<el-input-number v-model="conf.ocr_retry_count" controls-position="right"
								 :min="0" :max="10"/>
				<div class="item-tip">
					调用服务超时或者返回错误时，重试的次数，可在图片识别服务配置时单独设置。
				</div>
			</el-form-item>
			<el-form-item label="复制结果">
				<ElCheckbox v-model="conf.auto_copy">自动复制文本翻译、图片识别结果到剪切板</ElCheckbox>
			</el-form-item>
			<el-form-item label="复制类型">
				<ElSelect v-model="conf.copy_type" :disabled="!conf.auto_copy"
						  placeholder="请选择复制类型" style="width: 250px">
					<ElOption label="使用首个文本翻译结果" value="first"/>
					<ElOption label="仅复制图片识别结果" value="ocr"/>
					<ElOptionGroup label="文本翻译服务">
						<ElOption v-for="item in trans" :key="item.id" :label="item.label" :value="item.id"/>
					</ElOptionGroup>
				</ElSelect>
			</el-form-item>
			<ElDivider/>

			<el-form-item label="启用缓存">
				<ElCheckbox v-model="conf.enable_cache">启用缓存后，会将每一次的翻译的结果缓存</ElCheckbox>
			</el-form-item>
			<el-form-item label="最大缓存时间(天)">
				<el-input-number v-model="conf.cache_day" controls-position="right" :min="0" />
				<div class="item-tip">到期自动清理命中率最低的缓存，为0时不自动清理。</div>
			</el-form-item>
			<el-form-item label="最大缓存条数">
				<el-input-number v-model="conf.cache_max_count" controls-position="right" :min="0" :step="100" />
				<div class="item-tip">超过限制自动清理命中率最低的缓存，为0时不限制。</div>
			</el-form-item>
			<el-form-item label="使用缓存结果">
				<ElCheckbox v-model="conf.use_cache"> 启用后，相同源文、语种、服务的内容将使用缓存结果。 </ElCheckbox>
			</el-form-item>
			<el-form-item label="保留词典结果">
				<ElCheckbox v-model="conf.reserve_word">启用后，不清理词典结果</ElCheckbox>
			</el-form-item>
			<el-form-item>
				<div class="flex">
					<button class="btn">清理缓存</button>
					<button class="btn">删除缓存</button>
				</div>
				<div class="item-tip mt-2">清理缓存仅删除命令率低的缓存，删除缓存会删除所有缓存。</div>
			</el-form-item>
			<el-divider></el-divider>
			<el-form-item label="备份/恢复">
				<div class="flex">
					<button class="btn">导入配置</button>
					<button class="btn">导出配置</button>
				</div>
			</el-form-item>
		</el-form>
	</div>
</template>

