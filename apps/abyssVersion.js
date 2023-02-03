import plugin from '../../../lib/plugins/plugin.js';
import common from '../../../lib/common/common.js';
import { segment } from 'oicq';
import commonTools from '../model/commonTools.js';
import fetch from 'node-fetch';

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
    this.url = commonTools.abyssUrl('ver');
  }



  /**深渊版本 */
  async abyssVersion () {
    let version = /^#?([1-9]\.\d)深渊$/.exec(this.e.msg)[1];

    if(!version) return false;

    let pics = [version, `${version}-11`, `${version}-12`];
    this.url += version;

    let msg = [];
    for (let i of pics) {
      let img = await this.getImg(`${this.url}/${i}.jpg`);
      if (img) {
        msg.push(img);
      }  
    }

    if (msg.length == 0) {
      await this.e.reply('暂无此版本');
      return false;
    }
    
    await this.e.reply(await common.makeForwardMsg(this.e, msg, `${version}深渊`));
  }

  /** 12层历史 */
  async history12 () {
    let room = /^#?历代12(层|-[1-3])?(最低输出量)?$/.exec(this.e.msg)[1];
    if (!room) return false;

    this.url += 'history12';

    let msg = [];
    let imgUrl = '';

    if (room === '层') {
      let pics = [1, 2, 3];
      for (let i of pics) {
        imgUrl = encodeURI(`${this.url}/历代12-${i}最低输出量.png`);
        let img = await this.getImg(imgUrl);
        if (img) {
          msg.push(img);
        }  
      }
      await this.e.reply(await common.makeForwardMsg(this.e, msg, `历代深渊12层最低输出量`));
    } else {
      imgUrl = encodeURI(`${this.url}/历代12${room}最低输出量.png`);
      msg = await this.getImg(imgUrl);
      await this.e.reply(msg);
    }

  }

  async teamRefer () {
    let ver = /^#?([1-9]\.\d)深渊?阵容(参考|推荐)?$/.exec(this.e.msg)[1];
    if (!ver) return false;

    this.url = commonTools.abyssUrl('team');
    this.url = encodeURI(`${this.url}卡玛sei亚/${ver}.png`);

    let img = await this.getImg(this.url);
    if (!img) {
      await this.e.reply(`暂无${ver}深渊阵容`);
      return false;
    }
    await this.e.reply(img);
  }

  /** 获取图片数据 */
  async getImg (url) {
    let res = await fetch(url);
    if (res.ok) {
      return segment.image(url);
    } else {
      return false;
    }
  }
}