import plugin from '../../../lib/plugins/plugin.js'
import common from '../../../lib/common/common.js'
import moracfg from '../model/config.js'
import _ from 'lodash'
import fs from 'node:fs'

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
          reg: '^#?(原神|星铁)?[1-9]\.\\d(深渊|混沌)$',
          fnc: 'abyssVersion'
        },
        {
          reg: '^#?历代12(层|-[1-3])?(最低输出量)?$',
          fnc: 'history12'
        },
        {
          reg: '^#?[1-9]\.\\d(深渊)?阵容(参考|推荐)?$',
          fnc: 'teamRefer'
        },
      ]
    })
    this.path = moracfg.getMoraPath('plus')
  }

  dirPath = (isSr) => {
    this.path = moracfg.getGameRes('gs')
    let dir = moracfg.getMoraPlus(this.path, 'abyss')
    if (isSr) {
      this.path = moracfg.getGameRes('hsr')
      dir = moracfg.getMoraPlus(this.path, 'chaos')
    }
    return dir
  }

  /**深渊版本 */
  async abyssVersion () {
    let match = /^#?(原神|星铁)?([1-9]\.\d)(深渊|混沌)$/.exec(this.e.msg)
    let version = match[2]
    let game = match[3]
    if(!version) return false

    let isSr = this.e.isSr
    if (game === '混沌') {
      isSr = true
    }

    this.path = `${this.dirPath(isSr)}/Version/`
    let check = moracfg.checkRes(this.path)
    if (check) {
      await this.e.reply(check)
      return false
    }

    this.path += version;
    if (!fs.existsSync(this.path)) {
      await this.e.reply('暂无此版本')
      return false
    }

    let msg = [];
    let pics = fs.readdirSync(this.path)
    _.each(pics, (v) => msg.push(segment.image(`file://${this.path}/${v}`)))

    if (_.isEmpty(msg)) {
      logger.error('图片获取失败')
      return false
    }
    
    if (msg.length > 1) {
      msg = await common.makeForwardMsg(this.e, msg, `${isSr ? '原神' : '星铁'}${version}${isSr ? '深渊' : '混沌'}`)
    } else {
      msg = msg[0]
    }
    
    await this.e.reply(msg)
    return true
  }

  /** 12层历史 */
  async history12 () {
    this.path = `${this.dirPath(this.e.isSr)}/Version/history12`
    let check = moracfg.checkRes(this.path)
    if (check) {
      await this.e.reply(check)
      return false
    }

    let room = /^#?历代12(层|-[1-3])?(最低输出量)?$/.exec(this.e.msg)[1];
    if (!room) return false;

    let msg = [];

    if (room === '层') {
      let pics = fs.readdirSync(this.path);
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
    this.path = `${this.dirPath(this.e.isSr)}/Teams/`
    let check = moracfg.checkRes(path)
    if (check) {
      await this.e.reply(check)
      return false
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