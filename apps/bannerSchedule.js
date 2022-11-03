import plugin from '../../../lib/plugins/plugin.js';
import common from '../../../lib/common/common.js';
import { pluginPath } from '../components/Changelog.js';
import { segment } from 'oicq';
import fs from 'node:fs';

export class bannerSchedule extends plugin {
  constructor() {
    super({
      name: '复刻表',
      dsc: '复刻时间表',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg:'^#?(角色|武器)?复刻表$',
          fnc: 'bannerSchedule'
        }
      ]
    })

    this.path = `${pluginPath}/resources/GenshinBanners`;
  }

  /** 发送复刻表 */
  async bannerSchedule() {
    if(!fs.existsSync(this.path)) {
      return false;
    }

    let match = /^#?(角色|武器)?复刻表$/.exec(this.e.msg);
    let banner = match[1];

    this.imgPath = `${this.path}/${banner}.png`;
    if (fs.existsSync(this.imgPath)) {
      await this.e.reply(segment.image(`file://${this.imgPath}`));
    } else {
      await this.e.reply(await this.allSchedule(this.e));
    }
  }

  async allSchedule(e) {
    let msg = [];
    let imgList = fs.readdirSync(this.path);
    for (let i of imgList) {
      let img = segment.image(`file://${this.path}/${i}`);
      msg.push(img);
    }
    return await common.makeForwardMsg(this.e, msg, '复刻时间表');
  }
}