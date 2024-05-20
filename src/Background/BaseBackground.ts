export interface ILogger {
	error(message: string, ...args: any): void
	warn(message: string, ...args: any): void
	info(message: string, ...args: any): void
	debug(message: string, ...args: any): void
}

export type UnlistenFn = () => void
export interface IEvent {
	on<T>(name: string, handler: (payload: T, windowLabel: string) => void): Promise<UnlistenFn>
	emit(name: string, ...args: any[]): void
	once<T>(name: string, handler: (payload: T, windowLabel: string) => void): Promise<UnlistenFn>
}

export interface IMenuItem {
	label: string
	checked?: boolean
	payload?: any
}

export interface IMenuOptions {
	position: { x: number, y: number }
	items: IMenuItem[]
}

export declare enum ResponseType {
	JSON = 1,
	Text = 2,
	Binary = 3
}
export interface IRequestOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
	headers?: Record<string, string>
	timeout?: number

	query?: Record<string, any>
	body?: Record<string, any>
	text?: string
	form?: Record<string, any>
	responseType?: ResponseType
}

export interface IResponse<T> {
	ok: boolean
	status: number
	data: T
}

export abstract class BaseBackground {
	public abstract label: string
	public abstract scaleFactor: number
	public abstract rootPath: string

	public abstract Logger: ILogger
	public abstract event: IEvent


	public abstract init(): Promise<void>

	public abstract hideWindow(): void
	public abstract closeWindow(): void
	public abstract showWindow(): Promise<void>
	public abstract getPosition(): Promise<{ x: number, y: number }>
	public abstract setPosition(x: number, y: number): Promise<void>
	public abstract getSize(): Promise<{ width: number, height: number }>
	public abstract setSize(width: number, height: number): Promise<void>
	public abstract isFocused(): Promise<boolean>
	public abstract setFocus(): Promise<void>
	public abstract isVisible(): Promise<boolean>
	public abstract setAlwaysOnTop(alwaysOnTop: boolean): Promise<void>
	public abstract setTitle(title: string): Promise<void>
	public abstract setFullscreen(fullscreen: boolean): Promise<void>

	public abstract messageBox(message: string, options?: { title?: string, type?: 'info' | 'error' }): Promise<void>
	public abstract ask(message: string, options?: { title?: string, type?: 'info' | 'warning' | 'error', okLabel?: string, cancelLabel?: string }): Promise<boolean>

	public abstract readClipboardText(): Promise<string>
	public abstract writeClipboardText(content: string): Promise<boolean>

	public abstract isRegisteredGlobalShortcut(shortcut: string): Promise<boolean>

	public abstract shellOpen(path: string): Promise<void>

	public abstract writeTextFile(path: string, content: string, append?: boolean): Promise<boolean>
	public abstract readTextFile(path: string): Promise<string>
	public abstract exists(path: string): Promise<boolean>
	public abstract removeFile(path: string): Promise<boolean>
	public abstract readDir(path: string, recursive?: boolean): Promise<string[]>
	public abstract createDir(path: string, recursive?: boolean): Promise<boolean>
	public abstract removeDir(path: string, recursive?: boolean): Promise<boolean>
	public abstract join(path: string, ...paths: string[]): Promise<string>
	public abstract appConfigDir(): Promise<string>

	public abstract invoke<T>(command: string, ...args: any[]): Promise<T>
	public abstract showMenu(options?: IMenuOptions, callback?: (payload?: any) => void): Promise<any>

	public abstract fetch<T>(url: string, options?: IRequestOptions): Promise<IResponse<T>>

	public abstract isAutostart(): Promise<boolean>
	public abstract setAutostart(enable: boolean): Promise<void>
}

export function handlerLoggerMsg(message: string, args: any[]) {
	let i = 0
	return message.replace(/{}/g, () => JSON.stringify(args[i++]))
}
