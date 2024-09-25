import {
	BaseBackground,
	handlerLoggerMsg,
	IMenuOptions,
	IRequestOptions,
	IResponse,
	UnlistenFn
} from './BaseBackground.ts'
import { event as TauriEvent,  path as TauriPath} from '@tauri-apps/api'
import { Resource, invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { currentMonitor,PhysicalSize,PhysicalPosition } from '@tauri-apps/api/window';
import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart";
import { showMenu } from 'tauri-plugin-context-menu'
import { trace, info, error, attachConsole,warn,debug } from "@tauri-apps/plugin-log";
import * as fs from "@tauri-apps/plugin-fs"
import * as dialog from "@tauri-apps/plugin-dialog"
import { writeText, readText } from "@tauri-apps/plugin-clipboard-manager"
import * as globalShortcut from "@tauri-apps/plugin-global-shortcut"
import * as shell from "@tauri-apps/plugin-shell"
import {fetch} from "@tauri-apps/plugin-http"
import {appConfigDir} from "@tauri-apps/api/path";
const appWindow = getCurrentWebviewWindow()


export class Tauri extends BaseBackground {
	rootPath = ''
	label = appWindow.label
	scaleFactor = 1.0
	Logger = {
		error(message: string, ...args: any) {
			error(handlerLoggerMsg(message, args)).catch(() => {})
		},
		warn(message: string, ...args: any) {
			warn(handlerLoggerMsg(message, args)).catch(() => {})
		},
		info(message: string, ...args: any) {
			info(handlerLoggerMsg(message, args)).catch(() => {})
		},
		debug(message: string, ...args: any) {
			debug(handlerLoggerMsg(message, args)).catch(() => {})
		}
	}

	event = {
		on<T>(name: string, handler: (payload: T, windowLabel: string) => void) {
			return TauriEvent.listen(name, function(e) {
				handler(e.payload as any, name)//e.windowLabel
			}) as Promise<UnlistenFn>
		},
		emit(name: string, ...args: any) {
			TauriEvent.emit(name, ...args).catch(() => {})
		},
		once<T>(name: string, handler: (payload: T, windowLabel: string) => void) {
			return TauriEvent.once(name, function(e){
				handler(e.payload as any, name)//e.windowLabel
			}) as Promise<UnlistenFn>
		}
	}

	async init() {
		this.rootPath = await TauriPath.appConfigDir()
		const moitor = await currentMonitor()
		this.scaleFactor = moitor.scaleFactor
	}

	hideWindow() {
		appWindow.hide().catch(() => {})
	}

	closeWindow() {
		appWindow.close().catch(() => {})
	}

	async showWindow() {
		await appWindow.show()
	}

	async getPosition(): Promise<{ x: number; y: number }> {
		const pos = await appWindow.outerPosition()
		return { x: pos.x, y: pos.y }
	}

	async setPosition(x: number, y: number) {
		//await appWindow.setPosition(new PhysicalPosition(x * this.scaleFactor, y * this.scaleFactor)).catch(() => {})
		await appWindow.setPosition(new PhysicalPosition(Math.floor(x), Math.floor(y))).catch(() => {})
	}

	async getSize(): Promise<{ width: number; height: number }> {
		const size = await appWindow.outerSize()
		return { width: size.width, height: size.height }
	}

	async setSize(width: number, height: number) {
		await appWindow.setSize(new PhysicalSize(Math.floor(width), Math.floor(height * this.scaleFactor)))
	}

	async isFocused() {
		return appWindow.isFocused()
	}

	async setFocus() {
		await appWindow.setFocus()
	}

	async isVisible() {
		return await appWindow.isVisible()
	}

	async setAlwaysOnTop(alwaysOnTop: boolean) {
		await appWindow.setAlwaysOnTop(alwaysOnTop)
	}

	async setTitle(title: string) {
		await appWindow.setTitle(title)
	}

	async setFullscreen(fullscreen: boolean): Promise<void> {
		await appWindow.setFullscreen(fullscreen)
	}

	async messageBox(message: string, options?: { title?: string, type?: 'info' | 'error' }): Promise<void> {
		await dialog.message(message,{ title: options?.title, type: options.type }).catch(() => {})
	}

	async ask(message: string, options?: { title?: string, type?: 'info' | 'warning' | 'error', okLabel?: string, cancelLabel?: string }): Promise<boolean> {
		return await dialog.confirm(message, { title: options?.title, type: options.type, okLabel: options.okLabel, cancelLabel: options.cancelLabel }).catch(() => false)
	}

	async readClipboardText() {
		return await readText()
	}

	async writeClipboardText(content: string) {
		try {
			await writeText(content)
			return true
		} catch (e){
			return false
		}
	}

	async isRegisteredGlobalShortcut(shortcut: string) {
		return globalShortcut.isRegistered(shortcut)
	}

	async shellOpen(path: string) {
		await shell.open(path).catch(() => {})
	}

	async writeTextFile(path: string, content: string, append?: boolean) {
		try {
			await fs.writeTextFile(path, content, { append })
			return true
		} catch {
			return false
		}
	}

	async readTextFile(path: string) {
		try {
			return await fs.readTextFile(path)
		} catch {
			return ''
		}
	}

	async exists(path: string) {
		try {
			return await fs.exists(path)
		} catch {
			return false
		}
	}

	async removeFile(path: string) {
		try {
			await fs.remove(path)
			return true
		} catch {
			return false
		}
	}

	async readDir(path: string, recursive: boolean = false) {
		try {
			return (await fs.readDir(path)).map((item) => item.name)
		} catch {
			return []
		}
	}

	async createDir(path: string, recursive: boolean = false) {
		try {
			await fs.create(path)
			return true
		} catch {
			return false
		}
	}

	async removeDir(path: string, recursive: boolean = false) {
		try {
			await fs.remove(path)
			return true
		} catch {
			return false
		}
	}

	async join(path: string, ...paths: string[]) {
		return TauriPath.join(path, ...paths)
	}

	async appConfigDir() {
		return TauriPath.appConfigDir()
	}

	async invoke<T>(command: string, ...args: any[]) {
		return await invoke<T>(command, ...args)
	}

	showMenu(options?: IMenuOptions, callback?: (payload?: any) => void): Promise<any> {
		return new Promise(async (resolve) => {
			function handler({ payload }: { payload: any }) {
				if (callback) {
					callback(payload)
				}
				resolve(payload)
			}
			await showMenu({
				pos: { x: options?.position.x, y: options?.position.y },
				items: options.items.map((x) => {
					return {
						label: x.label,
						checked: x.checked,
						payload: x.payload,
						event: handler
					}
				})
			})
		})
	}

	async fetch<T>(url: string, options?: IRequestOptions): Promise<IResponse<any>> {
		let reqData: {
			method?: string,
			headers?: Record<string, string>,
			body?: any,
			query?: Record<string, string>,
			timeout?: number
			responseType?: any
		} = {}
		if (!options) options = {}
		reqData.method = options.method || 'GET'
		if (options.headers && Object.keys(options.headers).length > 0) {
			reqData.headers = options.headers || {}
		}
		if (options.query && Object.keys(options.query).length > 0) {
			reqData.query = options.query || {}
			url += "?"
			for (const item in reqData.query){
				url += "&"+item + "="+reqData.query[item]
			}
		}
		if (options.text) {
			reqData.body = options.text//http.Body.text(options.text)
		}
		if (options.form) {
			reqData.body = options.form//http.Body.form(options.form)
		}
		if (options.body) {
			reqData.body = JSON.stringify(options.body)//http.Body.json(options.body)
		}
		if (options.responseType !== undefined) {
			reqData.responseType = options.responseType
		}
		reqData.timeout = options.timeout || 5000
		//const res = await fetch(url, reqData as any)
		/*let headers = new Headers()
		headers.append("Content-Type","application/json")*/

		let rqet = new Request(url,reqData);
		const res = await fetch(rqet)
		return {
			ok: res.ok,
			status: res.status,
			data: await res.json()
		}
	}

	async isAutostart(): Promise<boolean> {
		return await isEnabled()
		//return await autostart.isEnabled()
	}

	async setAutostart(enabled: boolean): Promise<void> {
		if (enabled) {
			await enable()
			//await autostart.enable()
		} else {
			await disable()
			//await autostart.disable()
		}
	}
}
