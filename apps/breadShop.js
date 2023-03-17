import plugin from '../../../lib/plugins/plugin.js';
import moraCfg from '../model/config.js';
import Shop from '../model/breadShop.js';


/** 
 * 改自 https://github.com/Mai-icy/nonebot-plugin-bread-shop
 * !!! 禁止外传
 * @author Rrrrrrray
 */
export class breadShop extends plugin {
  constructor () {
    super ({
      name: '面包商店',
      dsc: '面包商店云崽版',
      event: 'message.group',
      priority: 5,
      rule: [
        {
          reg: '^#(.*?)$',
          fnc: 'breadShop'
        }
      ]
    })
    this.cfg = moraCfg.getSetYaml('breadShop', true);
    this.shop = this.cfg.shop;
    this.stuff = this.cfg.stuff;
  }

  async breadShop () {
    if (!this.shop) return false;
    if (!this.e.msg.includes(this.stuff)) return false;

    if (this.e.msg.includes('帮助')) {
      this.e.reply(this.breadShopHelp());
      return true;
    }
    
    this.e.msg = this.e.msg.replace(/#|＃/g, '');
    let data = {
      msg: this.e.msg,
      at: this.e.at,
      user_id: this.e.user_id,
      name: this.e.sender.card,
      group_id: this.e.group_id,
    }

    let res = await new Shop().shop(data);
    if (!res) return false;

    this.e.reply(res, false, { recallMsg: 110, at: true });
    return true;
  }

  breadShopHelp () {
    return [
      `\n🥑${this.stuff}商店使用说明🥑`, 
      '指令	        说明',
      `买${this.stuff}		购买随机${this.stuff}`, 
      `啃${this.stuff}		吃随机${this.stuff}`,
      `抢${this.stuff}+@	抢随机${this.stuff}`,
      `送${this.stuff}+@	送随机${this.stuff}`,
      `赌${this.stuff}+""	猜拳赌随机${this.stuff}`,
      `${this.stuff}记录+""　查看操作次数最多的人`,
      `${this.stuff}记录+@　查看操作次数`,
      `查看${this.stuff}+@　查看面包数据`,
      `${this.stuff}排行	本群排行榜top5`,
    ].join('\n');
  }
}