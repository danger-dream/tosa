import { writeClipboardText } from '../../Background'
import { IBaseSelectionTranslator } from '../../types'

export const Copy: IBaseSelectionTranslator = {
	name: 'copy',
	label: '复制内容',
	icon: 'duplicate',
	description: '复制当前选中内容至剪贴板',
	Verify: text => !!text.trim(),
	Invoke: async text => {
		await writeClipboardText(text)
	}
}
