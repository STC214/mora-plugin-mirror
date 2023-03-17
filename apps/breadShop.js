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
        },{
          reg: '^#(面包)?商店使用说明$',
          fnc: 'breadShopHelp'
        }
      ]
    })
    this.cfg = moraCfg.getSetYaml('breadShop', true);
    this.shop = this.cfg.shop;
  }

  async breadShop () {
    if (!this.shop) return false;
    let stuff = this.cfg.stuff;
    if (!this.e.msg.includes(stuff)) return false;
    
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

  async breadShopHelp() {
    let msg = [
      '商店使用说明', 
      '指令	        说明',
      '买面包		购买随机面包', 
      '啃面包		吃随机面包',
      '抢面包+@	抢随机面包',
      '送面包+@	送随机面包',
      '赌面包+""	猜拳赌随机面包',
      '面包记录+""　查看操作次数最多的人',
      '面包记录+@　查看操作次数',
      '查看面包+@　查看面包数据',
      '面包排行+	本群排行榜top5',
    ]
    
    this.e.reply(msg.join('\n'));
  }
}