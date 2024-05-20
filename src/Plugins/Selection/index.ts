import { IBaseSelectionTranslator } from '../../types'
import {Translate} from './Translate'
import {Copy} from './Copy'
import {Link} from './Link'
import {Baidu} from './Baidu'
import {Bing} from './Bing'
import {Google} from './Google'

export const plugins: IBaseSelectionTranslator[] = [Translate, Copy, Link, Baidu, Bing, Google]
