import { emit } from '../../Background'
import { IBaseSelectionTranslator } from '../../types'

export const Translate: IBaseSelectionTranslator = {
	name: 'translate',
	label: '翻译',
	icon: 'icon',
	description: '翻译当前选中内容',
	Verify: text => !!text.trim(),
	Invoke: async text => emit('translator://text', text)
}
