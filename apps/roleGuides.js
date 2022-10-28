import plugin from '../../../lib/plugins/plugin.js';
import gsCfg from '../../genshin/model/gsCfg.js';
import common from '../../../lib/common/common.js';
import { segment } from 'oicq';
import lodash from 'lodash';
import fs from 'node:fs';
import fetch from 'node-fetch';

/**
 * 借鉴原云崽攻略代码
 * 不会覆盖原指令
 * 攻略来自米游社@坤易
 */

export class roleGuides extends plugin{
  constructor(){
    super({
      name: '角色一图流',
      dsc: '角色一图流',
      event: 'message',
      priority: 500,
      rule: [
        {
          reg: '^#?(更新)?\\S+一图流$',
          fnc: 'roleGuide'
        }
      ]
    })

    this.path = './plugins/mora-plugin/data';
    this.url = 'https://bbs-api.mihoyo.com/post/wapi/getPostFullInCollection?&gids=2&order_type=2&collection_id=';
    this.uploader = [
      {
      collection_id: 22148,
      source: '坤易'
      }
    ];
    this.oss = '?x-oss-process=image//resize,s_1200/quality,q_90/auto-orient,0/interlace,1/format,jpg'
  }

  /**初始化 */
  async init () {
    if(!fs.existsSync(this.path)){
      fs.mkdirSync(this.path);
    }
    this.path += '/roleGuides';
    if(!fs.existsSync(this.path)){
      fs.mkdirSync(this.path)
    }
  }

  /**一图流 */
  async roleGuide(){
    let match = /^#?(更新)?(\S+)一图流$/.exec(this.e.msg);
    let isUpdate = !!match[1];
    let roleName = match[2];

    // let group = match[3] ? match[3] : this.set.defaultSource

    let role = gsCfg.getRole(roleName);
    if(!role) return false;

    this.path += `/roleGuides/${this.uploader[0].source}`;
    this.sfPath = `${this.path}/${role.name}.jpg`;
    console.log(this.sfPath);

    if (fs.existsSync(this.sfPath) && !isUpdate) {
      await this.e.reply(segment.image(`file://${this.sfPath}`));
      return
    }

    if (await this.getImg(role.name)) {
      await this.e.reply(segment.image(`file://${this.sfPath}`));
    }
  }

  /**下载攻略图 */
  async getImg (name) {
    let msyRes = []
    // this.uploader[0].collection_id.forEach((id) => msyRes.push(this.getData(this.url + id)));
    msyRes.push(this.getData(this.url + this.uploader[0].collection_id));
    

    try {
      msyRes = await Promise.all(msyRes)
    } catch (error) {
      this.e.reply('暂无攻略数据，请稍后再试')
      logger.error(`米游社接口报错：${error}}`)
      return false
    }

    let posts = lodash.flatten(lodash.map(msyRes, (item) => item.data.posts))
    let url
    for (let val of posts) {
      /** 攻略图个别来源特殊处理 */
      /**if (group == 4) {
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
      }*/
      if (val.post.subject.includes(name)) {
        let max = 0
        val.image_list.forEach((v, i) => {
          if (Number(v.size) >= Number(val.image_list[max].size)) max = i
        })
        url = val.image_list[max].url
        break
      }
    }

    if (!url) {
      this.e.reply(`暂无${name}攻略（${this.uploader[0].source}）\n请尝试其他的攻略来源查询\n#攻略帮助，查看说明`)
      return false
    }

    logger.mark(`${this.e.logFnc} 下载${name}攻略图`)

    if (!await common.downFile(url + this.oss, this.sfPath)) {
      return false
    }

    logger.mark(`${this.e.logFnc} 下载${name}攻略成功`)

    return true
  }

   /** 获取数据 */
   async getData (url) {
    let response = await fetch(url, { method: 'get' });
    if (!response.ok) {
      return false;
    }
    const res = await response.json();
    return res;
  }
}