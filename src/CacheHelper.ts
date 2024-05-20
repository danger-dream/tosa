import { MD5 } from 'crypto-js'
import { IDictResult } from './types'
import { uuid } from './Utils'
import { debug } from './Logger'
import { exists, getRootPath, join, readTextFile, writeTextFile } from './Background'

export interface ICacheItem {
	id: string
	group_id: string
	hash: string
	service: string
	label: string
	timestamp: number
	hit: number
	text: string
	from: string
	to: string
	result: string | IDictResult
	is_word: boolean
	timecost: number
}

export class CacheHelper {
	private root_path: string = ''
	public max_day: number = 0
	public max_count: number = 0
	public reserve_word: boolean = true
	public records: ICacheItem[] = []
	private __save_temp_list: ICacheItem[] = []
	private __interval: NodeJS.Timeout | undefined = undefined

	constructor(public name: string) {
	}

	private async save() {
		try {
			await writeTextFile(this.root_path, JSON.stringify(this.records))
		} catch {}
	}

	public setConfig(max_day: number, max_count: number, reserve_word: boolean) {
		this.max_day = max_day
		this.max_count = max_count
		this.reserve_word = reserve_word
	}

	public async start() {
		if (this.__interval) return
		this.root_path = await join(getRootPath(), '.' + this.name + '.dat')
		if (await exists(this.root_path)) {
			try {
				this.records = JSON.parse(await readTextFile(this.root_path) || '{}')
			} catch {}
		}
		const self = this
		this.__interval = setInterval(function () {
			if (self.__save_temp_list.length) {
				self.finish()
				self.save().catch(() => {})
			}
		}, 5000)
		debug(`CacheHelper: ${ this.name } started`)
	}

	public async stop(){
		await this.dispose()
		debug(`CacheHelper: ${ this.name } stopped`)
	}

	public async clear(): Promise<number> {
		const clear_ids: string[] = []
		for (const item of this.records) {
			let isClear = false
			if (this.max_day > 0 && Date.now() - item.timestamp > this.max_day * 24 * 60 * 60 * 1000) {
				isClear = true
			}
			if (this.reserve_word && item.is_word) {
				isClear = false
			}
			if (!isClear) {
				continue
			}
			clear_ids.push(item.id)
		}
		let n = 0
		for (const id of clear_ids) {
			const index = this.records.findIndex(x => x.id !== id)
			if (index >= 0) {
				this.records.splice(index, 1)
				n++
			}
		}
		if (n > 0) {
			await this.save()
		}
		return n
	}

	public add(
		group_id: string, service: string, label: string, text: string, from: string, to: string,
		result: string | IDictResult, timecost: number
	) {
		if (this.max_count > 0 && this.records.length >= this.max_count) {
			this.records.shift()
		}
		const item = {
			id: uuid(),
			group_id,
			hash: MD5(service + text + from + to).toString(),
			service,
			label,
			timestamp: Date.now(),
			hit: 0,
			text,
			from,
			to,
			result,
			is_word: typeof result !== 'string',
			timecost
		}
		this.records.push(item)
		this.saveChanges()
		return item.id
	}

	public get(service: string, text: string, from: string, to: string) {
		const hash = MD5(service + text + from + to).toString()
		return this.records.find(x => x.hash === hash)
	}

	public hit(id: string) {
		const record = this.records.find(x => x.id === id)
		if (record) {
			record.hit++
			this.saveChanges()
		}
		return this
	}

	public clearAll() {
		const n = this.records.length
		this.records = []
		this.saveChanges()
		return n
	}

	public deleteById(id: string) {
		const index = this.records.findIndex(x => x.id === id)
		if (index >= 0) {
			this.records.splice(index, 1)
			this.saveChanges()
			return true
		}
		return false
	}

	public page(page: number, size: number) {
		const start = (page - 1) * size
		const end = start + size
		return this.records.reverse().slice(start, end)
	}

	public count() {
		return this.records.length
	}

	public groupPage(page: number, size: number) {
		const start = (page - 1) * size
		const end = start + size
		const groups: Record<string, ICacheItem[]> = {}
		for (const item of this.records) {
			if (!groups[item.group_id]) {
				groups[item.group_id] = []
			}
			groups[item.group_id].push(item)
		}
		return Object.keys(groups).map(k => groups[k]).reverse().slice(start, end)
	}

	public async dispose() {
		await this.save()
		this.records = []
		this.__save_temp_list = []
		clearInterval(this.__interval)
		this.__interval = undefined
	}

	private saveChanges() {
		this.__save_temp_list = this.records
		return this
	}

	private finish() {
		if (this.__save_temp_list.length) {
			this.records = this.__save_temp_list
			this.__save_temp_list = []
		}
		return this
	}


}
