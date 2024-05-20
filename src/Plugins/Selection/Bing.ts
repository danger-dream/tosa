import { shellOpen } from '../../Background'
import { IBaseSelectionTranslator } from '../../types'

export const Bing: IBaseSelectionTranslator = {
	name: 'bing',
	label: '必应搜索',
	icon: 'bing',
	description: '使用必应搜索当前选中内容',
	Verify: text => !!text.trim(),
	Invoke: async text => await shellOpen('https://www.bing.com/search?q=' + encodeURIComponent(text))
}
