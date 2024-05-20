import { shellOpen } from '../../Background'
import { IBaseSelectionTranslator } from '../../types'

export const Baidu: IBaseSelectionTranslator = {
	name: 'baidu',
	label: '百度搜索',
	icon: 'baidu',
	description: '使用百度搜索当前选中内容',
	Verify: text => !!text.trim(),
	Invoke: async text => await shellOpen('https://www.baidu.com/#wd=' + encodeURIComponent(text))
}
