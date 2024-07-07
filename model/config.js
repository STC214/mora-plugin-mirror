import YAML from 'yaml'
import chokidar from 'chokidar'
import fs from 'node:fs'
import { promisify } from 'node:util'
import _ from 'lodash'
import { Data, isV3, pluginPath } from '../components/index.js'

/**
 * 配置文件
 * 借鉴逍遥插件
 */
class moracfg {
  constructor () {
    this.def = `${pluginPath}/config/default/`
    this.user = `${pluginPath}/config/user/`
  }

  get resNotFound () {
    return '还没下载/更新资源包，该功能用不了捏\n请发送【#更新摩拉资源】以进行更新'
  }

  /** 通用yaml读取 */
  getfileYaml (path, name) {
    let file = `${path}${name}.yaml`
    return fs.existsSync(file) ? YAML.parse(fs.readFileSync(file, 'utf8')) : {}
  }

  /** 设置读取 */
  getSetYaml (name, isCopy = false) {
    if (isCopy) this.defSetCopy(name)

    let setPath = fs.existsSync(`${this.user + name}.yaml`) ? this.user : this.def
    return this.getfileYaml(setPath, name)
  }

  /** 配置拷贝 */
  defSetCopy (name) {
    name += '.yaml'
    if (!fs.existsSync(this.user)) fs.mkdirSync(this.user)

    if (!fs.existsSync(this.user + name)) fs.copyFileSync(this.def + name, this.user + name)
  }

  getMoraPath (name) {
    let path = pluginPath
    switch (name) {
      case 'def':
        path = this.def
        break
      case 'user':
        path = this.user
        break
      case 'res':
        path += '/resources/'
        break
      case 'plus':
        path += '/resources/mora-plugin-res/'
        break
      case 'data':
        path += '/data/'
        break
    }
    return path
  }

  getGameRes (name) {
    let path = this.getMoraPath('plus')
    switch (name) {
      case 'banner':
        path += 'Banners'
        break
      case 'gs':
        path += 'Genshin/'
        break
      case 'sr':
        path += 'StarRail/'
        break
      case 'zzz':
        path += 'ZenlessZoneZero/'
        break
    }
    return path
  }

  getMoraPlus (model, name) {
    let path = this.getGameRes(model)
    switch (name) {
      case 'role':
        path += 'Roles'
        break
      case 'team':
        path += 'TeamGuides'
        break
      case 'abyss':
        path += 'Abyss'
        break
      case 'chaos':
        path += 'Chaos'
        break
    }
    return path
  }
}

export default new moracfg()
