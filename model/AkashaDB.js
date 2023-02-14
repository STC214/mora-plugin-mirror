import moraBase from './moraBase.js';
import fetch, { Headers } from 'node-fetch';
import gsCfg from '../../genshin/model/gsCfg.js';
import _ from 'lodash';
import commonTools from './commonTools.js';

export default class AkashaDB extends moraBase{
  constructor (e) {
    super(e);
    this.abyss_url = 'https://akashadata.com/static/data/abyss_total.js?v=';
    const meta = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.42"
    }
    this.myHeaders = new Headers(meta);
  }

    /**
    * 获取数据
    * @param {String} url 请求地址
    * @returns json数据
    */
    async getData (rarity) {
      let v = Math.random() * 10;
      this.abyss_url += v;

      let response = await fetch(this.abyss_url, { headers: this.myHeaders, method: 'get', redirect: 'follow' });
      if (!response.ok) {
        return false;
      }
      
      let res = await response.text();
      res = JSON.parse(res.split('=')[1]);
      let usageData = {
        abyssVersion: res.schedule_version_desc,
        updateTime: res.modify_time,
        characterList: this.listFilter(res.character_used_list, rarity),
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
      _.each(list, v => {
        let role = gsCfg.getRole(v.name);
        v.name = role.name;
      });
      if (rarity) {
        list = _.filter(list, v => _.isEqual(v.rarity, rarity));
      }
      return list;
    }
}