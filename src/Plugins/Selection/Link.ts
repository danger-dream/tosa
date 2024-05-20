import { shellOpen } from '../../Background'
import { IBaseSelectionTranslator } from '../../types'

const localhostDomainRE = /^localhost[:?\d]*(?:[^:?\d]\S*)?$/
const nonLocalhostDomainRE = /^[^\s.]+\.\S{2,}$/

export const Link: IBaseSelectionTranslator = {
	name: 'link',
	label: '打开链接',
	icon: 'link',
	description: '打开链接',
	Verify: text => {
		const v = text.trim()
		if (!v) return false
		const match = v.match(/^(?:\w+:)?\/\/(\S+)$/)
		if (!match) return false
		const everythingAfterProtocol = match[1]
		if (!everythingAfterProtocol) return false

		return localhostDomainRE.test(everythingAfterProtocol) ||
			nonLocalhostDomainRE.test(everythingAfterProtocol)
	},
	Invoke: async text => await shellOpen(text)
}
