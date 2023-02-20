import moraBase from './moraBase.js';
import fetch, { Headers } from 'node-fetch';
import gsCfg from '../../genshin/model/gsCfg.js';
import _ from 'lodash';
import commonTools from './commonTools.js';

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

    res.team_list = this.transTeamList(res.team_list, role_res);
    res.team_up_list = this.transTeamList(res.team_up_list, role_res);
    res.team_down_list = this.transTeamList(res.team_down_list, role_res);

    await redis.set(`${this.prefix}abyss_total`, JSON.stringify(res));
    return true;
  }
  
  /**
  * 获取数据
  * @param {String} url 请求地址
  * @returns json数据
  */
  async getUsageRate (rarity) {
    let data = await this.get_data();
    let usageData = {
      abyssVersion: data.schedule_version_desc,
      updateTime: data.modify_time,
      characterList: this.listFilter(data.character_used_list, rarity),
    };

    let render = await commonTools.getRenderData('Akasha', 'abyss', usageData);
    return render;
  }

  async teamsPage (half, sort, page) {
    let data = await this.get_data();
    let teamList = data.team_list;
    let _sort = 'mr';
    let _count = 'ac'
    if (_.isEqual(half, '上半')) {
      teamList = data.team_up_list;
      _sort = 'umr';
      _count = 'uc';
    } else if (_.isEqual(half, '下半')){
      teamList = data.team_down_list;
      _sort = 'dmr';
      _count = 'dc';
    }
    if (_.isEqual(sort, '满星率')) {
      teamList = _.orderBy(teamList, [_sort], ['desc']);
    }
    _.each(teamList, v => {
      v.count = v[_count];
      v.fullstar = v[_sort];
    });

    teamList = _.chunk(teamList, 14);
    let teamData = {
      abyssVersion: data.schedule_version_desc,
      updateTime: data.modify_time,
      page: page,
      teamList: teamList[page - 1],
    };

    let render = await commonTools.getRenderData('Akasha', 'teams', teamData);
    return render;
  }

  async get_data () {
    let key = `${this.prefix}abyss_total`;
    if (!await redis.exists(key)) {
      await this.getData();
    }
    return JSON.parse(await redis.get(key));
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

  transTeamList (list, role_res) {
    _.each(list, v => {
      v.tl = _.map(v.tl, i => {
        if (_.isEqual(role_res[i].name, '旅行者')) {
          return '主角';
        } else {
          return role_res[i].name;
        }  
      });
      v.mr = Number(v.mr);
      v.uc = Number(v.uc);
      v.dc = Number(v.dc);
      v.umr = Number(v.umr);
      v.dmr = Number(v.dmr);
    });

    return list;
  }
}