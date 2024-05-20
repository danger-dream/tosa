import { shellOpen } from '../../Background'
import { IBaseSelectionTranslator } from '../../types'

export const Google: IBaseSelectionTranslator = {
	name: 'google',
	label: '谷歌搜索',
	icon: 'google',
	description: '使用谷歌搜索当前选中内容',
	Verify: text => !!text.trim(),
	Invoke: async text => await shellOpen('https://www.google.com/search?q=' + encodeURIComponent(text))
}
