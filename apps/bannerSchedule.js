import plugin from '../../../lib/plugins/plugin.js'
import Banner from '../model/banner.js'

export class bannerSchedule extends plugin {
  constructor () {
    super({
      name: '复刻表',
      dsc: '复刻时间表',
      event: 'message',
      priority: 5,
      rule: [
        {
          reg: '^#?(原神|星铁)?(角色|武器|光锥)?复刻表$',
          fnc: 'bannerSchedule'
        },
        {
          reg: '^#(原神|星铁|绝区零)?\\S+(复刻|卡池)$',
          fnc: 'bannerCount'
        }
      ]
    })
  }

  /** 发送复刻表 */
  async bannerSchedule () {
    let match = /^#?(原神|星铁)?(角色|武器|光锥)?复刻表$/.exec(this.e.msg)
    let msg = await new Banner(this.e).schedules(match[2])
    if (!msg) return false

    await this.e.reply(msg)
    return true
  }

  /** 复刻详情 */
  async bannerCount () {
    let name = /^#(原神|星铁|绝区零)?(\S+)(复刻|卡池)$/.exec(this.e.msg)[2]

    let msg = await new Banner(this.e).searchBanners(name)
    if (!msg) return false

    await this.e.reply(msg)
    return true
  }
}
