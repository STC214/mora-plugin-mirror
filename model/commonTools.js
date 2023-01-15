import fetch from "node-fetch";
import { pluginPath } from "../components/Changelog.js";
import gsCfg from "../../genshin/model/gsCfg.js";
class commonTools {
  constructor () {
    this._path = process.cwd();
    this.profilePicPath = `${this._path}/plugins/genshin/resources/img/role/`;
  }

  /**
   * 获取爬取数据
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

  getWeapon (msg) {
    let name = this.getWeaponFullName(msg);
    let weapon = gsCfg.getdefSet('weapon','data').Name;
    console.log(weapon);
  }
  
  getWeaponFullName (msg) {
    let shortName = gsCfg.getdefSet('weapon','other').sortName;
    let abbr = Object.values(shortName).indexOf(msg);
    if (abbr < 0) {
      return false;
    }
    let full = Object.keys(shortName)[abbr];
    console.log(full);

    return full;
  }
  
}

export default new commonTools();