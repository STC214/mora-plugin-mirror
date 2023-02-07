import plugin from '../../../lib/plugins/plugin.js';
import common from '../../../lib/common/common.js';
import { segment } from 'oicq';
import fs from 'node:fs';
import moracfg from '../model/config.js';
import commonTools from '../model/commonTools.js';
import _ from 'lodash';

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

    this.path = moracfg.getMoraPlus('banner');    
  }

  /** 发送复刻表 */
  async bannerSchedule () {
    if (!fs.existsSync(this.path)) {
      await this.e.reply('还没下载资源包，复刻表功能用不了捏');
      return false;
    }

    let match = /^#?(角色|武器)?复刻表$/.exec(this.e.msg);
    let banner = !!match[1] ? [match[1]] : ['角色', '武器'];

    let msg = [];
    for (let i of banner) {
      let imgPath = `${this.path}/${i}.png`;
      if (fs.existsSync(imgPath)) {
        msg.push(segment.image(`file://${imgPath}`));
      }
    }

    if (_.isEmpty(msg)) {
      return false;
    }

    if (msg.length > 1) {
      await this.e.reply(await common.makeForwardMsg(this.e, msg, `复刻时间表`));
    } else {
      await this.e.reply(msg[0]);
    }
    return true;
  }

  /** 复刻详情 */
  async bannerCount () {
    let name = /^#(\S+)(复刻|卡池)$/.exec(this.e.msg)[1];
    console.log(name);
    
    name = commonTools.getBanner(name);
    if (!name) {
      await this.e.reply('常驻角色不支持查询');
      return false;      
    }

    let pool = commonTools.getPool(name.type, name.name);
    if (!pool) {
      return false;
    }

    let msg = [`${name.name}卡池详情`, ...pool];

    await this.e.reply(await common.makeForwardMsg(this.e, msg, msg[0]));
    return true;
  }
}