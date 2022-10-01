// 适配V3 Yunzai，将index.js移至app/index.js

// ======================================================================
// 适配参考zhi-plugin，miao-plugin，兼容V2以及V3云崽，谢谢喵喵插件和白纸插件的贡献 ^_^
// ======================================================================

import Data from './components/Data.js';
import { isV3, moraVersion } from './components/Changelog.js';

export * from './apps/index.js'

let index = { mora: {} }
if (isV3) {
  index = await Data.importModule('/plugins/mora-plugin/adapter', 'index.js')
}

export const mora = index.mora || {}

if (Bot?.logger?.info) {
  Bot.logger.info(`摩拉插件${moraVersion}初始化~`)
} else {
  console.log(`摩拉插件${moraVersion}初始化~`)
}