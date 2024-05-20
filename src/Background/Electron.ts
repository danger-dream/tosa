import { BaseBackground, IEvent, ILogger, IMenuOptions, IRequestOptions, IResponse } from './BaseBackground'

export class Electron extends BaseBackground {
    public label: string;
    public scaleFactor: number;
    public rootPath: string;
    public Logger: ILogger;
    public event: IEvent;
    public init(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public hideWindow(): void {
        throw new Error('Method not implemented.');
    }
    public closeWindow(): void {
        throw new Error('Method not implemented.');
    }
    public showWindow(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public getPosition(): Promise<{ x: number; y: number; }> {
        throw new Error('Method not implemented.');
    }
    public setPosition(x: number, y: number): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public getSize(): Promise<{ width: number; height: number; }> {
        throw new Error('Method not implemented.');
    }
    public setSize(width: number, height: number): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public isFocused(): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    public setFocus(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public isVisible(): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    public setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public setTitle(title: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public setFullscreen(fullscreen: boolean): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public messageBox(message: string, options?: { title?: string; type?: 'info' | 'error'; }): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public ask(message: string, options?: { title?: string; type?: 'info' | 'error' | 'warning'; okLabel?: string; cancelLabel?: string; }): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    public readClipboardText(): Promise<string> {
        throw new Error('Method not implemented.');
    }
    public writeClipboardText(content: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    public isRegisteredGlobalShortcut(shortcut: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    public shellOpen(path: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public writeTextFile(path: string, content: string, append?: boolean): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    public readTextFile(path: string): Promise<string> {
        throw new Error('Method not implemented.');
    }
    public exists(path: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    public removeFile(path: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    public readDir(path: string, recursive?: boolean): Promise<string[]> {
        throw new Error('Method not implemented.');
    }
    public createDir(path: string, recursive?: boolean): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    public removeDir(path: string, recursive?: boolean): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    public join(path: string, ...paths: string[]): Promise<string> {
        throw new Error('Method not implemented.');
    }
    public appConfigDir(): Promise<string> {
        throw new Error('Method not implemented.');
    }
    public invoke<T>(command: string, ...args: any[]): Promise<T> {
        throw new Error('Method not implemented.');
    }
    public showMenu(options?: IMenuOptions, callback?: (payload?: any) => void): Promise<any> {
        throw new Error('Method not implemented.');
    }
    public fetch<T>(url: string, options?: IRequestOptions): Promise<IResponse<T>> {
        throw new Error('Method not implemented.');
    }
    public isAutostart(): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    public setAutostart(enable: boolean): Promise<void> {
        throw new Error('Method not implemented.');
    }

}
