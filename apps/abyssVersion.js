import plugin from '../../../lib/plugins/plugin.js'
import commonTools from '../model/commonTools.js'
import moracfg from '../model/config.js'
import _ from 'lodash'
import fs from 'node:fs'
import Challenge from '../model/challenge.js'

/**
 * 借鉴原云崽攻略代码
 * 攻略来自NGA@妮可少年
 */

export class abyssVersion extends plugin {
  constructor () {
    super({
      name: '深渊版本',
      dsc: '各版本深渊怪物',
      event: 'message',
      priority: 5,
      rule: [
        {
          reg: '^#?(原神|星铁)?[1-9]\.\\d(深渊|混沌)$',
          fnc: 'abyssVersion'
        },
        {
          reg: '^#?历代12(层|-[1-3])?(最低输出量)?$',
          fnc: 'history12'
        },
        {
          reg: '^#?[1-9]\.\\d(深渊)?阵容(参考|推荐)?$',
          fnc: 'teamRefer'
        }
      ]
    })
  }

  dirPath = (game = 'gs') => {
    let dir = { gs: 'abyss', sr: 'chaos' }
    return moracfg.getMoraPlus(game, dir[game])
  }

  /** 深渊版本 */
  async abyssVersion () {
    let match = /^#?(原神|星铁)?([1-9]\.\d)(深渊|混沌)$/.exec(this.e.msg)
    let version = match[2]
    let abyss = match[3]
    if (!version) return false

    const msg = await new Challenge(this.e).challenges(abyss, version)
    if (!msg) return false

    await this.e.reply(msg)
    return true
  }

  /** 12层历史 */
  async history12 () {
    this.path = `${this.dirPath(this.e.game)}/Version/history12`
    await this.checkRes(this.path)

    let room = /^#?历代12(层|-[1-3])?(最低输出量)?$/.exec(this.e.msg)[1]
    if (!room) return false

    let msg = []

    if (room === '层') {
      let pics = fs.readdirSync(this.path)
      _.each(pics, (v) => msg.push(segment.image(`file://${this.path}/${v}`)))
      await this.e.reply(await commonTools.makeMsg(this.e, msg, '历代深渊12层最低输出量'))
    } else {
      let img = `${this.path}/历代12${room}最低输出量.png`
      if (fs.existsSync(img)) await this.e.reply(segment.image(`file://${img}`))
    }
    return true
  }

  async teamRefer () {
    this.path = `${this.dirPath(this.e.game)}/Teams/`
    await this.checkRes(this.path)

    let ver = /^#?([1-9]\.\d)深渊?阵容(参考|推荐)?$/.exec(this.e.msg)[1]
    if (!ver) return false

    let img = `${this.path}卡玛sei亚/${ver}.png`
    if (!fs.existsSync(img)) {
      await this.e.reply(`暂无${ver}深渊阵容`)
      return false
    }
    await this.e.reply(segment.image(`file://${img}`))
    return true
  }

  async checkRes (path) {
    if (!fs.existsSync(path)) {
      await this.e.reply('还没下载/更新资源包，该功能用不了捏\n请发送【#更新摩拉资源】以进行更新', true)
      return false
    }
  }
}
