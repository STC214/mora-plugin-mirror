import plugin from '../../../lib/plugins/plugin.js'
import fs from 'node:fs'
import moracfg from '../model/config.js'
import RoleGuide from '../model/roleGuide.js'

/**
 * 借鉴原云崽攻略代码
 * 默认覆盖所有【xx攻略】原指令，不想覆盖可以把priority调整为5000
 * 攻略来自米游社
 * @author Rrrrrrray
 * !!!禁止倒卖
 */
export class roleGuides extends plugin{
  constructor () {
    super({
      name: '米游社角色攻略',
      dsc: '米游社角色攻略',
      event: 'message',
      priority: 5,
      rule: [
        {
          reg: '^#?(更新)?\\S+(攻略|一图流)$',
          fnc: 'roleGuide'
        },
        {
          reg: '^#?(星铁)?\\S+(参考面板|收益曲线|进阶(攻略|参考)?)$',
          fnc: 'roleRef'
        },
        {
          reg: '^#?收益曲线帮助$',
          fnc: 'curveHelp'
        },
        {
          reg: '^#?(星铁)?参考面板帮助$',
          fnc: 'curveHelp'
        }
      ]
    }) 
  }

  /**初始化 */
  async init () {
    let path = moracfg.getMoraPath('data')
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path)
    }
    if(!fs.existsSync(`${path}roleGuides`)){
      fs.mkdirSync(`${path}roleGuides`)
    }
    if(!fs.existsSync(`${path}roleGuides/add_ons`)){
      fs.mkdirSync(`${path}roleGuides/add_ons`)
    }
  }

  /**角色一图流 */
  async roleGuide () {
    let match = /^#?(更新)?(\S+)(攻略|一图流)$/.exec(this.e.msg)
    let isUpdate = !!match[1]
    let roleName = match[2]

    let msg = await new RoleGuide(this.e).strategies(roleName, isUpdate)
    if (!msg) return false

    await this.e.reply(msg)
    return true
  }

  async roleRef () {
    let match = /^#?(星铁)?(\S+)(参考面板|收益曲线|进阶(攻略|参考)?)$/.exec(this.e.msg)
    let roleName = match[2]

    let msg = await new RoleGuide(this.e).stat_curve(roleName)
    if (!msg) return

    await this.e.reply(msg)
    return true
  }

  async curveHelp () {
    let msg = await new RoleGuide(this.e).getHelp()
    if (!msg) return false

    await this.e.reply(msg)
    return true
  }
}