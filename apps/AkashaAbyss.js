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
          reg: '^#?虚空(深渊)?(五星|四星)?使用率$',
          fnc: 'akashaUsageRate'
        }, {
          reg: '^#?虚空(深渊)?(上半|下半)?队伍(出战数|满星率)?([1-9][0-9]0?)?$',
          fnc: 'teamsOverview'
        }
      ],
      
    });
    this.task = {
      name: '虚空数据库',
      fnc: () => this.akashaData(),
      cron: '0 0 */2 * * ?'
    };
  }

  /**
   * 使用率
   */
  async akashaUsageRate () {
    // 稀有度
    let rarity = /^#?虚空(深渊)?(五星|四星)?使用率$/.exec(this.e.msg)[2];
    if (rarity === "五星") {
      rarity = 5;
    } else if (rarity === "四星") {
      rarity = 4;
    }

    let data = await new AkashaDB(this.e).getUsageRate(rarity);
    if (!data) return false;

    let img = await puppeteer.screenshot('AkashaAbyss', data); 
    if (img) await this.e.reply(img);
    return true;
  }

  async teamsOverview () {
    let match = /^#?虚空(深渊)?(上半|下半)?队伍(出战数|满星率)?([1-9][0-9]0?)?$/.exec(this.e.msg);
    let half = match[2];
    let sort = match[3];
    let num = match[4] ? Number(match[4]) : 20;

    let data = await new AkashaDB(this.e).getTeamsOV(half, sort, num);
    if (!data) return false;

    let img = await puppeteer.screenshot('AkashaAbyss', data);
    if (img) await this.e.reply(img);
    return true;
  }

  async akashaData () {
    logger.mark('虚空数据：更新中...');
    return await new AkashaDB(this.e).getData();
  }
}