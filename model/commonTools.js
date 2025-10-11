import common from '../../../lib/common/common.js'
import { pluginPath, moraVer, yzInfo } from '../components/index.js'
import _ from 'lodash'
import moracfg from './config.js'
import fs from 'node:fs'
import { dirname } from 'node:path'

class commonTools {
  constructor () {
    this._path = process.cwd()
    this.rolePicPath = `${pluginPath}/resources/img/role/`
  }

  /**
   * 获取数据
   * @param {string} url 访问地址
   * @returns 数据
   */
  async getFetchData (url) {
    let response = await fetch(url, { method: 'get' })
    if (!response.ok) return false

    const res = await response.json()
    return res
  }

  /**
   * 截图模板
   * @param {Object} parent 父级目录
   * @param {String} model 模型名称
   * @param {Object} data 数据
   * @returns 数据渲染模板
   */
  getRenderData (parent, model, data) {
    return {
      tplFile: `${pluginPath}/resources/html/${parent}/${model}.html`,
      pluResPath: `${pluginPath}/resources/`,
      profilePic: this.rolePicPath,
      watermark: `Created By Yunzai-Bot ${yzInfo.version} & Mora-Plugin ${moraVer}`,
      quality: 100,
      ...data
    }
  }

  /** 下载文件 */
  async download (url, spath, opts = {}) {
    const dir = dirname(spath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    let res = await fetch(url, opts)
    if (!res.ok) return false

    res = Buffer.from(await res.arrayBuffer())

    fs.writeFileSync(spath, res)
    logger.info('[Mora]下载成功')
    return true
  }

  get travelerID () {
    return [10000005, 10000007, 20000000]
  }

  /** 主角特殊处理 */
  traveler (alias, name, type) {
    let travelers = ['风主', '岩主', '雷主', '草主', '水主', '火主']
    if (!travelers.includes(alias)) {
      travelers = _.map(travelers, v => `${v}${type}`)
      return `请选择${name}${type}：${_.join(travelers, '、')}`
    } else return alias
  }

  trailblazer (name, type) {
    let trailblazers = {
      物主: { ids: [8001, 8002], alias: ['物', '物理', '毁灭'] },
      火主: { ids: [8003, 8004], alias: ['火', '存护'] },
      虚数主: { ids: [8005, 8006], alias: ['虚数', '同谐', '同协', '虚'] },
      冰主: { ids: [8007, 8008], alias: ['冰', '记忆'] },
    }

    const alias = ['主', '主角', '爷', '开拓者', '星', '穹']

    if (_.tail(alias).includes(name)) {
      trailblazers = _.map(_.keys(trailblazers), v => `${v}${type}`)
      return `请选择${name}${type}：${_.join(trailblazers, '、')}`
    } else {
      let find = _.find(trailblazers, v => new RegExp(`(${v.alias.join('|')})(${alias.join('|')})`).test(name))
      if (find) {
        return {
          name: `${find.alias[0]}主`,
          roleId: find.ids[0],
          reg: `(${find.alias.join('|')})(${_.take(alias, 4).join('|')})`
        }
      }
    }
  }

  async makeMsg (e, data = [], title = '', force = false) {
    const forwardMsg = moracfg.getSetYaml('config', true).forwardMsg
    if (data.length === 1) return data[0]
    else if (forwardMsg || force) return await common.makeForwardMsg(e, data, title)
    else return [title, ...data]
  }
}

export default new commonTools()
