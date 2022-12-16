import plugin from '../../../lib/plugins/plugin.js';
import gsCfg from '../../genshin/model/gsCfg.js';
import common from '../../../lib/common/common.js';
import { segment } from 'oicq';
import lodash from 'lodash';
import fs from 'node:fs';
import commonTools from '../model/commonTools.js';

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
      priority: 500,
      rule: [
        {
          reg: '^#?[1-9]\.\\d深渊$',
          fnc: 'abyssVersion'
        },
      ]
    })

    this.url = 'https://gitee.com/Rrrrrrray/mora-plugin-res/raw/master/AbyssVer/';
  }



  /**深渊版本 */
  async abyssVersion () {
    let version = /^#?([1-9]\.\d)深渊$/.exec(this.e.msg)[1];
    console.log(version);
    // let isUpdate = !!match[1];

    if(!version) return false;

    let pics = [version, `${version}-11`, `${version}-12`];
    this.url += version;
    let msg = [];
    for (let i of pics) {
      let img = `${this.url}/${i}.jpg`;
      let res = await fetch(img);
      if (res.ok) {
        msg.push(segment.image(img));
      }
    }

    if (msg.length == 0) {
      await this.e.reply('暂无此版本');
      return false;
    }
    
    await this.e.reply(await common.makeForwardMsg(this.e, msg, `${version}深渊`));
  }

}