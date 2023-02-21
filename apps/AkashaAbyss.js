import plugin from '../../../lib/plugins/plugin.js';
import AkashaDB from '../model/AkashaDB.js';
import puppeteer from '../../../lib/puppeteer/puppeteer.js';
import fs from 'node:fs';
import moracfg from '../model/config.js';
import { segment } from 'oicq';

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
          reg: '^#?虚空(深渊)?(上半|下半)?队伍(出战数|满星率)?([1-7])?$',
          fnc: 'teamsOverview'
        }, {
          reg: '^#?虚空深渊帮助$',
          fnc: 'akashaHelp'
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
    let match = /^#?虚空(深渊)?(上半|下半)?队伍(出战数|满星率)?([1-7])?$/.exec(this.e.msg);
    let half = match[2] || '';
    let sort = match[3] || '出战数';
    let page = match[4] ? Number(match[4]) : 1;

    let data = await new AkashaDB(this.e).teamsPage(half, sort, page);
    if (!data) return false;
    data.filter = `${half}队伍${sort}`;

    let img = await puppeteer.screenshot('AkashaAbyss', data);
    if (img) await this.e.reply([img]);
    return true;
  }

  async akashaHelp () {
    let path = `${moracfg.getMoraPath('res')}img/AkashaHelp.png`;
    if (!fs.existsSync(path)) {
      return false;
    }
    await this.e.reply(segment.image(path));
    return true;
  }

  async akashaData () {
    logger.mark('虚空数据：更新中...');
    return await new AkashaDB(this.e).getData();
  }
}