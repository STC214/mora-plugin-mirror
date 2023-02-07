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
 */
const _path = process.cwd();

export class roleGuides extends plugin{
  constructor(){
    super({
      name: '米游社攻略一图流',
      dsc: '米游社攻略一图流',
      event: 'message',
      priority: 5,
      rule: [
        {
          reg: '^#?(更新)?\\S+(攻略|一图流)$',
          fnc: 'roleGuide'
        },
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

    let msg = [];
    /** 主角特殊处理 */
    if (['10000005', '10000007', '20000000'].includes(String(role.roleId))) {
      let travelers = ['风主', '岩主', '雷主', '草主'];
      if (!travelers.includes(role.alias)) {
        travelers = _.map(travelers, (v) => `${v}攻略`);
        msg = `请选择${roleName}攻略：${_.join(travelers, '、')}`;
        await this.e.reply(msg);
        return;
      } else {
        role.name = role.alias;
      }
    }

    // TODO: 同作者res、data的进行整合
    let res = fs.readdirSync(this.resPath);
    let resdir = this.resImg(role.name, res);
    let guide = _.concat(this.uploader.news, this.uploader.olds);
    let dir = this.dirPath(role.name, this.uploader.news);
    let addons = fs.readdirSync(`${this.path}/add_ons`);
    let addon_img = this.addonImg(role.name, addons);
    
    msg.push(...resdir);

    for (let i in dir) {
      if (res.includes(guide[i].source)) {
        continue;
      }
      if (addons.includes(guide[i].source)) {
        continue;
      }
      let success = true;
      if (!fs.existsSync(dir[i]) || isUpdate) {
        success = await this.getImg(role.name, guide[i], dir[i]);
      }  
      if (success) {
        msg.push(segment.image(`file://${dir[i]}`));
      } 
    }

    msg.push(...addon_img);

    if (msg.length === 0) {
      await this.e.reply('暂无攻略数据，请稍后再试');
      return false;
    }

    await this.e.reply(await common.makeForwardMsg(this.e, msg, `${role.name}攻略`));
    return true;
  }

  /** 资源包 */
  resImg (name, res) {
    let msg = [];
    let resdir = _.map(res, (v) => {
      let role = fs.readdirSync(`${this.resPath}/${v}`);
      role = _.filter(role, (r) => _.includes(r, name));
      if (_.isEmpty(role)) {
        return false;
      } else {
        return `${this.resPath}/${v}/${role}`;
      }
    });
    
    _.each(resdir, (v) => {
      if (fs.existsSync(v)) {
        console.log(v);
        msg.push(segment.image(`file://${v}`));
      }
    });
    return msg;
  }

  /** 路径处理 */
  dirPath (name, news) {
    let dir = _.take(fs.readdirSync(this.defpath), 4);
    dir = _.map(dir, (v) => `${this.defpath + v}/${name}.jpg`);

    let newdir = _.map(news, (v) => `${this.path}/${v.source}/${name}.jpg`);

    dir = _.concat(newdir, dir);

    return dir;
  }

  /** 附加包 */
  addonImg (name, addons) {
    let msg = [];
    let addondir = _.map(addons, (v) => `${this.path}/add_ons/${v}/${name}.jpg`);
    addondir = _.filter(addondir, (v) => fs.existsSync(v));

    _.each(addondir, (v) => {
      if (fs.existsSync(v)) {
        msg.push(segment.image(`file://${v}`));
      }
    });

    return msg;
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