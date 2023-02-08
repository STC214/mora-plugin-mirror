import plugin from '../../../lib/plugins/plugin.js';
import common from '../../../lib/common/common.js';
import { segment } from 'oicq';
import moracfg from '../model/config.js';
import _ from 'lodash';
import fs from 'node:fs';

/**
 * 借鉴原云崽攻略代码
 * 攻略来自NGA@妮可少年
 */

export class abyssVersion extends plugin {
  constructor(){
    super({
      name: '深渊版本',
      dsc: '各版本深渊怪物',
      event: 'message',
      priority: 5,
      rule: [
        {
          reg: '^#?[1-9]\.\\d深渊$',
          fnc: 'abyssVersion'
        },
        {
          reg: '^#?历代12(层|-[1-3])?(最低输出量)?$',
          fnc: 'history12'
        },
        {
          reg: '^#?[1-9]\.\\d(深渊)?阵容(参考|推荐)?$',
          fnc: 'teamRefer'
        }
      ]
    })
    this.path = moracfg.getMoraPlus('abyss');
  }

  /**深渊版本 */
  async abyssVersion () {
    this.path += '/Version/';
    if (!fs.existsSync(this.path)) {
      await this.e.reply('还没下载资源包，深渊版本功能用不了捏');
      return false;
    }

    let version = /^#?([1-9]\.\d)深渊$/.exec(this.e.msg)[1];
    if(!version) return false;

    this.path += version;
    if (!fs.existsSync(this.path)) {
      await this.e.reply('暂无此版本');
      return false;
    }

    let msg = [];
    let pics = fs.readdirSync(this.path);
    _.each(pics, (v) => msg.push(segment.image(`file://${this.path}/${v}`)));

    if (_.isEmpty(msg)) {
      logger.error('图片获取失败');
      return false;
    }
    
    await this.e.reply(await common.makeForwardMsg(this.e, msg, `${version}深渊`));
    return true;
  }

  /** 12层历史 */
  async history12 () {
    this.path += '/Version/history12';
    if (!fs.existsSync(this.path)) {
      await this.e.reply('还没下载资源包，深渊版本功能用不了捏');
      return false;
    }

    let room = /^#?历代12(层|-[1-3])?(最低输出量)?$/.exec(this.e.msg)[1];
    if (!room) return false;

    let msg = [];

    if (room === '层') {
      let pics = fs.readdirSync(this.path);;
      _.each(pics, (v) => msg.push(segment.image(`file://${this.path}/${v}`)));
      await this.e.reply(await common.makeForwardMsg(this.e, msg, `历代深渊12层最低输出量`));
    } else {
      let img = `${this.path}/历代12${room}最低输出量.png`;
      if (fs.existsSync(img)) {
        await this.e.reply(segment.image(`file://${img}`));
      }
    }
    return true;
  }

  async teamRefer () {
    this.path += '/Teams/';
    if (!fs.existsSync(this.path)) {
      await this.e.reply('还没下载资源包，深渊版本功能用不了捏');
      return false;
    }

    let ver = /^#?([1-9]\.\d)深渊?阵容(参考|推荐)?$/.exec(this.e.msg)[1];
    if (!ver) return false;

    let img = `${this.path}卡玛sei亚/${ver}.png`;
    if (!fs.existsSync(img)) {
      await this.e.reply(`暂无${ver}深渊阵容`);
      return false;
    }
    await this.e.reply(segment.image(`file://${img}`));
    return true;
  }
}