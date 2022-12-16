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
          reg:'^#?(更新)?(角色|武器)?复刻表$',
          fnc: 'bannerSchedule'
        }
      ]
    })

    this.path = `${pluginPath}/data/GenshinBanners`;
    this.url = 'https://gitee.com/Rrrrrrray/mora-plugin-res/raw/master/GenshinBanners/'
  }

  /** 初始化 */
  async init() {
    if(!fs.existsSync(`${pluginPath}/data`)){
      fs.mkdirSync(`${pluginPath}/data`);
    }
    if(!fs.existsSync(this.path)){
      fs.mkdirSync(this.path);
    }
  }

  /** 发送复刻表 */
  async bannerSchedule() {
    let match = /^#?(更新)?(角色|武器)?复刻表$/.exec(this.e.msg);
    let isUpdate = !!match[1];
    let banner = !!match[2] ? [`${match[2]}.png`] : ['角色.png', '武器.png'];

    let msg = [];
    for (let i of banner) {
      let imgUrl = encodeURI(this.url + i);
      let imgPath = `${this.path}/${i}`;
      if (!fs.existsSync(imgPath) || isUpdate) {
        await this.getImg(imgUrl, imgPath);
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

  /** 获取图片数据 */
  async getImg (url, path) {
    let res = await fetch(url);
    if (res.ok) {
      return await common.downFile(url, path);
    }
  }
}