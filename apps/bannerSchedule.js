import plugin from '../../../lib/plugins/plugin.js';
import common from '../../../lib/common/common.js';
import { pluginPath } from '../components/index.js';
import { segment } from 'oicq';
import fs from 'node:fs';
import commonTools from '../model/commonTools.js';

export class bannerSchedule extends plugin {
  constructor() {
    super({
      name: '复刻表',
      dsc: '复刻时间表',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg:'^#?(更新)?(角色|武器)?复刻表$',
          fnc: 'bannerSchedule'
        },
        {
          reg:'^#\\S+(复刻|卡池)$',
          fnc:'bannerCount'
        }
      ]
    })

    this.path = `${pluginPath}/data/GenshinBanners`;    
  }

  /** 初始化 */
  async init () {
    if(!fs.existsSync(`${pluginPath}/data`)){
      fs.mkdirSync(`${pluginPath}/data`);
    }
    if(!fs.existsSync(this.path)){
      fs.mkdirSync(this.path);
    }
  }

  /** 发送复刻表 */
  async bannerSchedule () {
    let match = /^#?(更新)?(角色|武器)?复刻表$/.exec(this.e.msg);
    let isUpdate = !!match[1];
    let banner = !!match[2] ? [`${match[2]}.png`] : ['角色.png', '武器.png'];
    let url = commonTools.getMoraRes('banner');

    let msg = [];
    for (let i of banner) {
      let imgUrl = encodeURI(url + i);
      let imgPath = `${this.path}/${i}`;
      if (!fs.existsSync(imgPath) || isUpdate) {
        await commonTools.download(imgUrl, imgPath);
      }
      if (fs.existsSync(imgPath)) {
        msg.push(segment.image(`file://${imgPath}`));
      }
    }

    if (msg.length === 0) {
      return false;
    }

    if (msg.length > 1) {
      await this.e.reply(await common.makeForwardMsg(this.e, msg, `复刻时间表`));
    } else {
      await this.e.reply(msg[0]);
    }
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
  }
}