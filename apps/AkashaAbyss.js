import plugin from '../../../lib/plugins/plugin.js';
import AkashaDB from '../model/AkashaDB.js';
import puppeteer from '../../../lib/puppeteer/puppeteer.js';
export class AkashaAbyss extends plugin {
  constructor () {
    super({
      name: '虚空深渊',
      dsc: '虚空数据库by白猫团队',
      event: 'message',
      priority: 5,
      rule: [
        {
          reg: '^#?虚空深渊(五星|四星)?使用率$',
          fnc: 'akashaUsageRate'
        },
      ]
    });
  }

  /**
   * 使用率
   */
  async akashaUsageRate () {
    // 稀有度
    let rarity = /^#?虚空深渊(五星|四星)?使用率$/.exec(this.e.msg)[1];
    if (rarity === "五星") {
      rarity = 5;
    } else if (rarity === "四星") {
      rarity = 4;
    }

    let data = await new AkashaDB(this.e).getData(rarity);
    if (!data) return false;

    let img = await puppeteer.screenshot('AkashaAbyss', data); 
    if (img) await this.e.reply(img);
    return true;
  }
}