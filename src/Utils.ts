import { v4 as uuidv4 } from 'uuid'
import { IUiConfig } from './types'

export function uuid() {
	return uuidv4()
}

export function generateParams(uiconfigs: IUiConfig[], params: Record<string, any>) {
	for (const ui of uiconfigs) {
		if (params[ui.name] !== undefined) {
			continue
		}
		if (ui.default !== undefined) {
			params[ui.name] = ui.default
			continue
		}
		switch (ui.type) {
			case 'input':
			case 'textarea':
			case 'password':
			case 'code':
			case 'select':
				params[ui.name] = ''
				break
			case 'number':
				params[ui.name] = 0
				break
			case 'checkbox':
				params[ui.name] = false
				break
			default:
				params[ui.name] = ''
		}
	}
	return params
}

export function racePromisesIgnoreErrors(promises: Promise<any>[]) {
	const reflectivePromise = (promise: Promise<any>): Promise<{ status: boolean, value?: any, reason?: any }> =>
		promise.then(value => ({ status: true, value }), reason => ({ status: false, reason }))
	return new Promise((resolve, reject) => {
		let ended = false
		let errors = []
		let completed = 0

		promises.forEach((p) => {
			reflectivePromise(p).then(result => {
				if (ended) return
				completed += 1
				if (result.status) {
					ended = true
					resolve(result.value)
				} else {
					errors.push(result.reason?.message || result.reason)
					if (completed === promises.length) {
						reject(errors)
					}
				}
			})
		})
	})
}

export function date_format(dt?: Date | number | string, fmt: string = 'yyyy-MM-dd hh:mm:ss'): string {
	if (!dt) {
		dt = new Date()
	}
	if (!(dt instanceof Date)) {
		dt = new Date(dt)
	}
	let o = {
		'M+': dt.getMonth() + 1,                 //月份
		'd+': dt.getDate(),                    //日
		'h+': dt.getHours(),                   //小时
		'm+': dt.getMinutes(),                 //分
		's+': dt.getSeconds(),                 //秒
		'q+': Math.floor((dt.getMonth() + 3) / 3), //季度
		'S': dt.getMilliseconds()             //毫秒
	}
	if (/(y+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, (dt.getFullYear() + '').substr(4 - RegExp.$1.length))
	}
	for (let k of Object.keys(o)) {
		if (new RegExp('(' + k + ')').test(fmt))
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
	}
	return fmt
}

export function deepEqual(a: any, b: any, ignoreKey?: string[]): boolean {
	if (typeof a !== typeof b) return false;
	if (typeof a !== 'object' || a === null || b === null) return a === b;
	const keysA = Object.keys(a);
	const keysB = Object.keys(b);
	if (keysA.length !== keysB.length) return false;
	for (let key of keysA) {
		if (ignoreKey?.length && ignoreKey.includes(key)) continue;
		if (!keysB.includes(key)) return false;
		if (!deepEqual(a[key], b[key])) return false;
	}
	return true;
}
