import moraBase from './moraBase.js';
import fetch, { Headers } from 'node-fetch';
import gsCfg from '../../genshin/model/gsCfg.js';
import _ from 'lodash';
import commonTools from './commonTools.js';
import moracfg from '../model/config.js';

export default class AkashaDB extends moraBase{
  constructor (e) {
    super(e);
    this.model = 'AkashaDB';
  }
  
  async getData () {
    let v = Math.random() * 10;
    let abyss_url = `https://akashadata.com/static/data/abyss_total.js?v=${v}`;
    let role_url = `https://t.akashadata.com/xstatic/json/static_card_dict.js?v=${v}`

    const meta = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.42"
    }
    this.myHeaders = new Headers(meta);

    let role_res = await fetch(role_url, { headers: this.myHeaders, method: 'get', redirect: 'follow' });
    if (!role_res.ok) {
      return false;
    }
    role_res = await role_res.text();
    role_res = JSON.parse(role_res.split('=')[1]);
    await redis.set(`${this.prefix}role_dict`, JSON.stringify(role_res));

    let abyss_res = await fetch(abyss_url, { headers: this.myHeaders, method: 'get', redirect: 'follow' });
    if (!abyss_res.ok) {
      return false;
    }
    
    let res = await abyss_res.text();
    res = JSON.parse(res.split('=')[1]);
    _.each(res.character_used_list, v => {
      let role = gsCfg.getRole(v.name);
      v.name = role.name;
    });

    _.each(res.team_list, team => {
      team.tl = _.map(team.tl, i => role_res[i].name);
    });

    await redis.set(`${this.prefix}abyss_total`, JSON.stringify(res));
    return true;
  }
  
  /**
  * 获取数据
  * @param {String} url 请求地址
  * @returns json数据
  */
  async getUsageRate (rarity) {
    if (!await redis.exists(`${this.prefix}abyss_total`)) {
      await this.getData();
    }
    let data = JSON.parse(await redis.get(`${this.prefix}abyss_total`));
    let usageData = {
      abyssVersion: data.schedule_version_desc,
      updateTime: data.modify_time,
      characterList: this.listFilter(data.character_used_list, rarity),
    }

    let render = await commonTools.getRenderData('Akasha', 'abyss', usageData);
    
    return render;
  }

  /**
   * 筛选数据
   * @param {Array} list 原数据
   * @param {Number} rarity 稀有度(筛选条件)
   * @returns 筛选后的数据
   */
  listFilter (list, rarity) {
    if (rarity) {
      list = _.filter(list, v => _.isEqual(v.rarity, rarity));
    }
    return list;
  }
}