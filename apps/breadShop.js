import plugin from '../../../lib/plugins/plugin.js'
import moraCfg from '../model/config.js'
import Shop from '../model/breadShop.js'

/**
 * 改自 https://github.com/Mai-icy/nonebot-plugin-bread-shop
 * @author Rrrrrrray
 */

const Cfg = moraCfg.getSetYaml('breadShop', true)

export class breadShop extends plugin {
  constructor () {
    super({
      name: '面包商店',
      dsc: '面包商店云崽版',
      event: 'message.group',
      priority: 5000,
      rule: [
        {
          reg: `^#\\S+(面包|${Cfg.stuff})(帮助|记录|排行)?$`,
          fnc: 'breadShop',
          log: false
        }
      ]
    })
    this.stuff = Cfg.stuff
  }

  async breadShop () {
    if (!Cfg.shop) return false
    let msg = this.e.msg

    if (msg.includes('面包') && this.stuff !== '面包') msg = msg.replace('面包', this.stuff)

    if (msg.includes('帮助')) {
      this.e.reply(this.breadShopHelp())
      return true
    }

    msg = msg.replace(/#|＃/g, '')
    let data = {
      msg,
      at: this.e.at,
      user_id: this.e.user_id,
      name: this.e.sender.card,
      group_id: this.e.group_id
    }

    let res = await new Shop().shop(data)
    if (!res) return false

    await this.e.reply(res, false, { recallMsg: 110, at: true })
    return true
  }

  breadShopHelp () {
    return [
      `🥑${this.stuff}商店使用说明🥑`,
      '指令	        说明',
      `买${this.stuff}		购买随机${this.stuff}`,
      `啃${this.stuff}		吃随机${this.stuff}`,
      `抢${this.stuff}+@	抢随机${this.stuff}`,
      `送${this.stuff}+@	送随机${this.stuff}`,
      `赌${this.stuff}+""	猜拳赌随机${this.stuff}`,
      `${this.stuff}记录+""　查看操作次数最多的人`,
      `${this.stuff}记录+@　查看操作次数`,
      `查看${this.stuff}+@　查看${this.stuff}数据`,
      `${this.stuff}排行	本群排行榜top5`
    ].join('\n')
  }
}
