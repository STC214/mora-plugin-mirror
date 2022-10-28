// 适配V3 Yunzai，将index.js移至app/index.js

// ======================================================================
// 适配参考zhi-plugin，miao-plugin，兼容V2以及V3云崽，谢谢喵喵插件和白纸插件的贡献 ^_^
// ======================================================================

import Data from './components/Data.js';
import { isV3, moraVersion } from './components/Changelog.js';
import fs from 'node:fs';


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

/**V3导入插件 */
const files = fs.readdirSync('./plugins/mora-plugin/apps').filter(file => file.endsWith('.js'));
let ret = []

files.forEach((file) => {
  ret.push(import(`./apps/${file}`))
})

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in files) {
  let name = files[i].replace('.js', '')

  if (ret[i].status != 'fulfilled') {
    logger.error(`载入插件错误：${logger.red(name)}`)
    logger.error(ret[i].reason)
    continue
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}
export { apps }