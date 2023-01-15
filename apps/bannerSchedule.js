import plugin from '../../../lib/plugins/plugin.js';
import common from '../../../lib/common/common.js';
import { pluginPath } from '../components/Changelog.js';
import { segment } from 'oicq';
import fs from 'node:fs';
import gsCfg from '../../genshin/model/gsCfg.js';
import moment from 'moment';
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
    this.url = 'https://gitee.com/Rrrrrrray/mora-plugin-res/raw/master/GenshinBanners/';
    this.type = 301;
    this.role5 = ['刻晴', '莫娜', '七七', '迪卢克', '琴', '提纳里'];
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

  /** 复刻详情 */
  async bannerCount() {
    let name = /^#(\S+)(复刻|卡池)$/.exec(this.e.msg)[1];
    console.log(name);
    let role = gsCfg.getRole(name);
    if (role) {
      // 角色
      this.type = 301;
      name = role.name;
      if (this.role5.includes(name)) {
        await this.e.reply('常驻角色不支持查询');
        return false;
      }
    } else {
      // 武器
      this.type = 302;
      name = commonTools.getWeaponFullName(name);
    }

    let pool = this.getPool(this.type, name);
    if (!pool) {
      return false;
    }

    let msg = [`${name}卡池详情`, ...pool];

    await this.e.reply(await common.makeForwardMsg(this.e, msg, msg[0]));
  }

  /** 获取图片数据 */
  async getImg (url, path) {
    let res = await fetch(url);
    if (res.ok) {
      return await common.downFile(url, path);
    }
  }

  // 找卡池
  getPool (type, name) {
    let poolCfg = gsCfg.getdefSet('pool', type);
    // 五星
    let poolFilter = poolCfg.filter(i => i.five.includes(name));
    // 四星
    if (poolFilter.length === 0) {
      poolFilter = poolCfg.filter(i => i.four.includes(name));
    }
    // 找不到
    if (poolFilter.length === 0) {
      return false;
    }

    // 计算天数
    let latest = poolFilter[0];
    let today = moment().format('YYYY-MM-DD');
    let end = moment(latest.to).format('YYYY-MM-DD');
    let elapsed = moment(today).diff(end, 'days');
    if (elapsed > 0) {
      elapsed = `${elapsed}天未复刻`;
    } else {
      elapsed = `当期UP，${elapsed < 0 ? '还有' + Math.abs(elapsed) : '今'}天结束卡池`;
    }
    
    // 整合卡池内容
    let pool = [];
    poolFilter.forEach(i => {
      pool.push([
        `卡池名称：${i.name.replace('|', '，')}`,
        `五星UP：${i.five.join('，')}`,
        `四星UP：${i.four.join('，')}`,
        `开始时间：${i.from}`,
        `结束时间：${i.to}`
      ].join('\n'));
    });

    return [elapsed, ...pool];
  }

}