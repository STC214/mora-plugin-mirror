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
          reg: '^#商店使用说明$',
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
    console.log(this.e);
    let data = {
      msg: this.e.msg,
      at: this.e.at,
      user_id: this.e.user_id,
      name: this.e.sender.card,
      group_id: this.e.group_id,
    }
    let res = await new Shop().shop(data);

    this.e.reply(res, true, { recallMsg: 110, at: true });
    return true;
  }
}