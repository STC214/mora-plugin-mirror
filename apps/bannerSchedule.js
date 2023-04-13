import plugin from '../../../lib/plugins/plugin.js'
import Banner from '../model/banner.js'

export class bannerSchedule extends plugin {
  constructor() {
    super({
      name: '复刻表',
      dsc: '复刻时间表',
      event: 'message',
      priority: 5,
      rule: [
        {
          reg:'^#?(角色|武器)?复刻表$',
          fnc: 'bannerSchedule'
        },
        {
          reg:'^#\\S+(复刻|卡池)$',
          fnc:'bannerCount'
        }
      ]
    }) 
  }

  /** 发送复刻表 */
  async bannerSchedule () {   
    let match = /^#?(角色|武器)?复刻表$/.exec(this.e.msg)
    let banner = !!match[1] ? [match[1]] : ['角色', '武器']

    let msg = await new Banner(this.e).schedules(banner)
    if (!msg) return false

    await this.e.reply(msg)
    return true
  }

  /** 复刻详情 */
  async bannerCount () {
    let name = /^#(\S+)(复刻|卡池)$/.exec(this.e.msg)[1]
    
    let msg = await new Banner(this.e).searchBanners(name)
    if (!msg) return false
    
    await this.e.reply(msg)
    return true
  }
}