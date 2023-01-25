import plugin from '../../../lib/plugins/plugin.js';
import gsCfg from '../../genshin/model/gsCfg.js';
import common from '../../../lib/common/common.js';
import { segment } from 'oicq';
import _ from 'lodash';
import fs from 'node:fs';
import commonTools from '../model/commonTools.js';
import moracfg from '../model/config.js';
import { pluginPath } from '../components/index.js';

/**
 * 借鉴原云崽攻略代码
 * 默认覆盖所有【xx攻略】原指令，不想覆盖可以把priority调整为5000
 * 攻略来自米游社
 */
const _path = process.cwd();

export class roleGuides extends plugin{
  constructor(){
    super({
      name: '米游社攻略一图流',
      dsc: '米游社攻略一图流',
      event: 'message',
      priority: 100,
      rule: [
        {
          reg: '^#?(更新)?\\S+(攻略|一图流)$',
          fnc: 'roleGuide'
        },

      ]
    })
    this.defpath = `${_path}/data/strategy/`;
    this.path = `${pluginPath}/data`;
    this.url = 'https://bbs-api.mihoyo.com/post/wapi/getPostFullInCollection?&gids=2&order_type=2&collection_id=';
    this.uploader = moracfg.getfileYaml(`${pluginPath}/config/`, 'guides');
    this.oss = '?x-oss-process=image//resize,s_1200/quality,q_90/auto-orient,0/interlace,1/format,jpg'
  }

  /**初始化 */
  async init () {
    if (!fs.existsSync(this.defpath)) {
      fs.mkdirSync(this.defpath)
    }
    /** 初始化子目录 */
    for (let subId of [1, 2, 3, 4]) {
      let defpath = this.defpath + '/' + subId
      if (!fs.existsSync(defpath)) {
        fs.mkdirSync(defpath)
      }
    }

    if(!fs.existsSync(this.path)){
      fs.mkdirSync(this.path);
    }
    if(!fs.existsSync(`${this.path}/roleGuides`)){
      fs.mkdirSync(`${this.path}/roleGuides`);
    }
  }

  /**角色一图流 */
  async roleGuide () {
    let match = /^#?(更新)?(\S+)(攻略|一图流)$/.exec(this.e.msg);
    let isUpdate = !!match[1];
    let roleName = match[2];
    let guide = this.uploader.roleGuide;

    let role = gsCfg.getRole(roleName);
    if(!role) return false;

    let dir = fs.readdirSync(this.defpath);
    dir = _.map(dir, (v) => `${this.defpath + v}/${role.name}.jpg`);
    let sources = _.map(guide, (v) => v.source);
    let source = _.drop(sources, 4);
    source = _.map(source, (v) => `${this.path}/roleGuides/${v}/${role.name}.jpg`);
    dir = _.concat(dir, source);

    let msg = [];
    for (const i in dir) {
      let success = true;
      if (!fs.existsSync(dir[i]) || isUpdate) {
        success = await this.getImg(role.name, guide[i], dir[i]);
      }  
      if (success) {
        msg.push(segment.image(`file://${dir[i]}`));
      } 
      // else {
      //   msg.push(`暂无${role.name}攻略（${sources[i]}）`);
      // }
    }

    if (msg.length === 0) {
      await this.e.reply('暂无攻略数据，请稍后再试');
      return false;
    }

    await this.e.reply(await common.makeForwardMsg(this.e, msg, `${role.name}攻略`));
  }

  /**
   * 下载攻略图
   * @param {String} name 角色名;
   * @param {Object} author 作者;
   */
  async getImg (name, author, sfPath) {
    let msyRes = []
    for (const i of author.collection_id) {
      msyRes.push(await commonTools.getFetchData(this.url + i));
    }
    
    try {
      msyRes = await Promise.all(msyRes);
    } catch (error) {
      logger.error(`米游社接口报错：${error}}`)
      return false;
    }

    let posts = _.flatten(_.map(msyRes, (item) => item.data.posts))
    let url
    for (let val of posts) {
      /** 攻略图个别来源特殊处理 */
      if (author.collection_id.includes(341523)) {
        if (val.post.structured_content.includes(name + '】')) {
          let content = val.post.structured_content.replace(/\\\/\{\}/g, '')
          let pattern = new RegExp(name + '】.*?image":"(.*?)"')
          let imgId = pattern.exec(content)[1]
          for (let image of val.image_list) {
            if (image.image_id == imgId) {
              url = image.url
              break
            }
          }
          break
        }
      } else {
        if (val.post.subject.includes(name)) {
          let max = 0
          val.image_list.forEach((v, i) => {
            if (Number(v.size) >= Number(val.image_list[max].size)) max = i
          })
          url = val.image_list[max].url
          break
        }
      }
    }

    if (!url) {
      logger.mark(`暂无${name}攻略（${author.source}）`);
      return false;
    }

    logger.mark(`${this.e.logFnc} 下载${author.source}-${name}攻略图`)

    if (!await common.downFile(url + this.oss, sfPath)) {
      return false
    }

    logger.mark(`${this.e.logFnc} 下载${author.source}-${name}攻略成功`)

    return true
  }

}