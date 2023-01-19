import fetch from "node-fetch";
import { pluginPath } from "../components/Changelog.js";
import gsCfg from "../../genshin/model/gsCfg.js";
import moment from 'moment';

class commonTools {
  constructor () {
    this._path = process.cwd();
    this.profilePicPath = `${this._path}/plugins/genshin/resources/img/role/`;
  }

  /**
   * 获取数据
   * @param {string} url 访问地址
   * @returns 数据
   */
  async getFetchData (url) {
    let response = await fetch(url, { method: 'get' });
    if (!response.ok) {
      return false;
    }
    const res = await response.json();
    return res;
  }

  /**
   * 截图模板
   * @param {Object} parent 父级目录
   * @param {String} model 模型名称
   * @param {Object} data 数据
   * @returns 数据渲染模板
   */
  async getRenderData (parent, model, data) {
		let render = {
			tplFile: `${pluginPath}/resources/html/${parent}/${model}.html`,
      pluResPath: `${pluginPath}/resources/`,
      profilePic: this.profilePicPath,
      quality: 100,
			...data,
		}
		return render;
	}

  /**
   * 查询卡池类型
   * @param {String} msg 消息
   * @returns 卡池类型，名字
   */
  getBanner (msg) {
    let name = msg;
    let type = 301;
    let role5 = ['刻晴', '莫娜', '七七', '迪卢克', '琴', '提纳里'];
    let role = gsCfg.getRole(name);
    if (role) {
      // 角色
      name = role.name;
      if (role5.includes(name)) {
        return false;
      }
    } else {
      // 武器
      type = 302;
      name = this.getWeapon(name);
    }

    return { 
      type: type,
      name: name
    };
  }
  /**
   * 武器查询
   * @param {String} name 武器名
   * @returns 武器
   */
  getWeapon (name) {
    let weapon = name;
    let weapons = gsCfg.getdefSet('weapon','data').Name;
    let names = Object.values(weapons);
    if (!names.includes(weapon)) {
      weapon = this.getWeaponFullName(weapon);
    }
    return weapon;
  }

  /** 
   * 武器全名
   * @param {String} weapon 武器名称
   * @returns 武器全名
   */
  getWeaponFullName (weapon) {
    let shortName = gsCfg.getdefSet('weapon','other').sortName;
    let abbr = Object.values(shortName).indexOf(weapon);
    if (abbr < 0) {
      return false;
    }
    weapon = Object.keys(shortName)[abbr];

    return weapon;
  }
  
  /**
   * 查询卡池
   * @param {Number} type 卡池类型
   * @param {String} name 卡池名字
   * @returns 卡池
   */
  getPool (type, name) {
    let poolCfg = gsCfg.getdefSet('pool', type);
    // 五星
    let poolFilter = poolCfg.filter(i => i.five.includes(name));
    // 四星
    if (poolFilter.length === 0) {
      poolFilter = poolCfg.filter(i => i.four.includes(name));
    }
    // 找不到
    if (poolFilter.length === 0) {
      return false;
    }

    // 计算天数
    let latest = poolFilter[0];
    let today = moment().format('YYYY-MM-DD');
    let end = moment(latest.to).format('YYYY-MM-DD');
    let elapsed = moment(today).diff(end, 'days');
    if (elapsed > 0) {
      elapsed = `${elapsed}天未复刻`;
    } else {
      elapsed = `当期UP，${elapsed < 0 ? '还有' + Math.abs(elapsed) : '今'}天结束卡池`;
    }
    
    // 整合卡池内容
    let pool = [];
    poolFilter.forEach(i => {
      pool.push([
        `卡池名称：${i.name.replace('|', '，')}`,
        `五星UP：${i.five.join('，')}`,
        `四星UP：${i.four.join('，')}`,
        `开始时间：${i.from}`,
        `结束时间：${i.to}`
      ].join('\n'));
    });

    return [elapsed, ...pool];
  }

  /**
   * res地址
   * @param {String} type res类型
   * @returns 
   */
  getMoraRes (type) {
    let url = 'https://gitee.com/Rrrrrrray/mora-plugin-res/raw/master/'
    switch (type) {
      case 'banner':
        url += 'GenshinBanners/';
        break;
      case 'abyss':
        url += 'AbyssVer/'
        break;
    }
    return url;
  }
}

export default new commonTools();