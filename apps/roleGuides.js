import plugin from '../../../lib/plugins/plugin.js';
import gsCfg from '../../genshin/model/gsCfg.js';
import common from '../../../lib/common/common.js';
import { segment } from 'oicq';
import _ from 'lodash';
import fs from 'node:fs';
import commonTools from '../model/commonTools.js';
import moracfg from '../model/config.js';

/**
 * 借鉴原云崽攻略代码
 * 默认覆盖所有【xx攻略】原指令，不想覆盖可以把priority调整为5000
 * 攻略来自米游社
 * @author Rrrrrrray
 * !!!禁止倒卖
 */
const _path = process.cwd();

export class roleGuides extends plugin{
  constructor(){
    super({
      name: '米游社角色攻略',
      dsc: '米游社角色攻略',
      event: 'message',
      priority: 5,
      rule: [
        {
          reg: '^#?(更新)?\\S+(攻略|一图流)$',
          fnc: 'roleGuide'
        },
        {
          reg: '^#?\\S+(参考面板|收益曲线)$',
          fnc: 'roleRef'
        }
      ]
    })
    this.defpath = `${_path}/data/strategy/`;
    this.path = moracfg.getMoraPath('data');
    this.uploader = moracfg.getSetYaml('roleGuides', true);
    this.resPath = moracfg.getMoraPlus('role');
    this.url = 'https://bbs-api.mihoyo.com/post/wapi/getPostFullInCollection?&gids=2&order_type=2&collection_id=';
    this.oss = '?x-oss-process=image//resize,s_1200/quality,q_90/auto-orient,0/interlace,1/format,jpg';
  }

  /**初始化 */
  async init () {
    if (!fs.existsSync(this.path)) {
      fs.mkdirSync(this.path);
    }
    if(!fs.existsSync(`${this.path}roleGuides`)){
      fs.mkdirSync(`${this.path}roleGuides`);
    }
    if(!fs.existsSync(`${this.path}roleGuides/add_ons`)){
      fs.mkdirSync(`${this.path}roleGuides/add_ons`);
    }
  }

  /**角色一图流 */
  async roleGuide () {
    let match = /^#?(更新)?(\S+)(攻略|一图流)$/.exec(this.e.msg);
    let isUpdate = !!match[1];
    let roleName = match[2];

    let role = gsCfg.getRole(roleName);
    if(!role) return false;

    this.path += 'roleGuides';

    /** 主角特殊处理 */
    if (commonTools.travelerID().includes(String(role.roleId))) {
      let traveler = commonTools.traveler(role.alias, roleName, '攻略');
      if (_.isEqual(role.alias, traveler)) {
        role.name = traveler;
      } else {
        await this.e.reply(traveler);
        return;
      }
    }
    
    let guide = _.concat(this.uploader.news, this.uploader.olds);
    let res_dir = this.findPack(`${this.resPath}/Guides`, role.name);
    let add_dir = this.findPack(`${this.path}/add_ons`, role.name);
    let dir = this.dirPath(role.name, res_dir, add_dir);

    let msg = [...res_dir];
    for (let i in dir) {
      let success = true;
      if (!fs.existsSync(dir[i]) || isUpdate) {
        success = await this.getImg(role.name, guide[i], dir[i]);
      }  
      if (success) {
        msg.push(dir[i]);
      } 
    }

    msg = _.map(_.uniq(msg), v => segment.image(v));
    if (_.isEmpty(msg)) {
      await this.e.reply('暂无攻略数据，请稍后再试');
      return false;
    }

    await this.e.reply(await common.makeForwardMsg(this.e, msg, `${role.name}攻略`));
    return true;
  }

  async roleRef () {
    let match = /^#?(\S+)(参考面板|收益曲线)$/.exec(this.e.msg);
    let roleName = match[1];
    let type = match[2];

    if (_.isEqual(type, '参考面板')) {
      this.resPath += '/RefStat';
    } else {
      this.resPath += '/YieldCurve';
      return false;
    }
    if (!fs.existsSync(this.resPath)) {
      await this.e.reply(`还没下载资源包，角色${type}功能用不了捏`);
      return false;
    }

    let role = gsCfg.getRole(roleName);
    if(!role) return false;
    /** 主角特殊处理 */
    if (commonTools.travelerID().includes(String(role.roleId))) {
      let traveler = commonTools.traveler(role.alias, roleName, type);
      if (_.isEqual(role.alias, traveler)) {
        role.name = traveler;
      } else {
        await this.e.reply(traveler);
        return;
      }
    }

    let img = fs.readdirSync(this.resPath);
    img = _.filter(img, v => _.includes(v, role.name));
    if (_.isEmpty(img)) {
      await this.e.reply(`暂无${query}${type}捏`);
      return;
    }

    img = _.map(img, v => `${this.resPath}/${v}`)[0];
    let msg = segment.image(`file://${img}`);
    await this.e.reply([msg, `\n※来源：米游社 @blue菌hehe ※`]);
    return true;
  }

  // 找本地图片
  findPack (path, name) {
    let _sources = fs.readdirSync(path);
    let dir = [];
    _.each(_sources, (author) => {
      let _roles = fs.readdirSync(`${path}/${author}`);
      _roles = _.filter(_roles, (r) => _.includes(r, name));
      let au_path = _.isEmpty(_roles) ? false : `${path}/${author}/${_roles[0]}`;
      dir.push(au_path);
    });

    dir = _.filter(dir, (v) => !!v);
    return dir;
  }

  /** 路径处理 */
  dirPath (name, res, add) {
    let olds = _.map(this.uploader.olds, (v) => v.source);
    let news = _.map(this.uploader.news, (v) => v.source);
    let dir = _.take(fs.readdirSync(this.defpath), 4);

    let _dir = [];
    // news
    _.each(news, (n) => {
      let _path = `${this.path}/${n}/${name}.jpg`;
      _.each(res, (r) => {
        if (_.includes(r, n)) {
          _path = r;
        }
      });
      _dir.push(_path);
    });
    // olds
    _.each(olds, (o, idx) => {
      let _def = `${this.defpath}${idx + 1}/${name}.jpg`;
      _.each(add, (a) => {
        if (_.includes(a, o)) {
          _def = a;
        }
      });
      _dir.push(_def);
    });
    
    dir = _.concat(_dir, add);
    dir = _.uniq(dir);
    return dir;
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
          let content = val.post.structured_content.replace(/\\\/\{\}/g, '');
          // 常驻角色特殊处理
          let pattern = new RegExp(name + '】.*?image\\\\?":\\\\?"(.*?)\\\\?"');
          let imgId = pattern.exec(content)[1];
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