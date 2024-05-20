import {
	BaseBackground,
	IMenuItem, IMenuOptions,
	IRequestOptions,
	ResponseType,
	IResponse,
	UnlistenFn
} from './BaseBackground.ts'

export type { IMenuItem, IMenuOptions, IRequestOptions, ResponseType, IResponse, UnlistenFn }


let base: BaseBackground

export async function initBackground() {
	try {
		const model = await import('./Tauri')
		base = new model.Tauri()
	} catch {
		try {
			const model = await import('./Electron')
			base = new model.Electron()
		} catch {
			throw new Error('No valid background found')
		}
	}
	await base.init()
}

export function getRootPath() {
	return base.rootPath
}

export function getLabel() {
	return base.label
}

export function scaleFactor() {
	return base.scaleFactor
}

export function Logger() {
	return base.Logger
}

export function listen<T>(name: string, handler: (payload: T, windowLabel: string) => void): Promise<UnlistenFn> {
	return base.event.on(name, handler)
}

export function emit(name: string, ...args: any[]) {
	return base.event.emit(name, ...args)
}

export function once<T>(name: string, handler: (payload: T, windowLabel: string) => void): Promise<UnlistenFn> {
	return base.event.once(name, handler)
}

export function hideWindow() {
	return base.hideWindow()
}

export function closeWindow() {
	return base.closeWindow()
}

export function showWindow() {
	return base.showWindow()
}

export function getPosition() {
	return base.getPosition()
}

export function setPosition(x: number, y: number) {
	return base.setPosition(x, y)
}

export function getSize() {
	return base.getSize()
}

export function setSize(width: number, height: number) {
	return base.setSize(width, height)
}

export function isFocused() {
	return base.isFocused()
}

export function setFocus() {
	return base.setFocus()
}

export function isVisible() {
	return base.isVisible()
}

export function setAlwaysOnTop(alwaysOnTop: boolean) {
	return base.setAlwaysOnTop(alwaysOnTop)
}

export function setTitle(title: string) {
	return base.setTitle(title)
}

export function setFullscreen(fullscreen: boolean) {
	return base.setFullscreen(fullscreen)
}

export function messageBox(message: string, options?: { title?: string, type?: 'info' | 'error' }) {
	return base.messageBox(message, options)
}

export function ask(message: string, options?: {
	title?: string,
	type?: 'info' | 'warning' | 'error',
	okLabel?: string,
	cancelLabel?: string
}) {
	return base.ask(message, options)
}

export function readClipboardText() {
	return base.readClipboardText()
}

export function writeClipboardText(content: string) {
	return base.writeClipboardText(content)
}

export function isRegisteredGlobalShortcut(shortcut: string) {
	return base.isRegisteredGlobalShortcut(shortcut)
}

export function shellOpen(path: string) {
	return base.shellOpen(path)
}

export function writeTextFile(path: string, content: string, append: boolean = false) {
	return base.writeTextFile(path, content, append)
}

export function readTextFile(path: string) {
	return base.readTextFile(path)
}

export function exists(path: string) {
	return base.exists(path)
}

export function removeFile(path: string) {
	return base.removeFile(path)
}

export function readDir(path: string, recursive?: boolean) {
	return base.readDir(path, recursive)
}

export function createDir(path: string, recursive?: boolean) {
	return base.createDir(path, recursive)
}

export function removeDir(path: string, recursive?: boolean) {
	return base.removeDir(path, recursive)
}

export function join(path: string, ...paths: string[]) {
	return base.join(path, ...paths)
}

export function appConfigDir() {
	return base.appConfigDir()
}

export function invoke<T>(command: string, ...args: any[]): Promise<T> {
	return base.invoke<T>(command, ...args)
}

export function showMenu(options?: IMenuOptions, callback?: (payload?: any) => void) {
	return base.showMenu(options, callback)
}

export function fetch<T>(url: string, options?: IRequestOptions) {
	return base.fetch<T>(url, options)
}

export function isAutostart() {
	return base.isAutostart()
}

export function setAutostart(enable: boolean) {
	return base.setAutostart(enable)
}
