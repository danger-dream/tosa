import { Logger } from './Background'
const log = Logger()

export function error(message: string, ...args: any) {
	log.error(message, args)
}

export function warn(message: string, ...args: any) {
	log.warn(message, args)
}

export function info(message: string, ...args: any) {
	log.info(message, args)
}

export function debug(message: string, ...args: any) {
	log.debug(message, args)
}
