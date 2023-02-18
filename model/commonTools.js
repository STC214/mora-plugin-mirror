import fetch from "node-fetch";
import common from '../../../lib/common/common.js';
import { pluginPath } from "../components/index.js";
import gsCfg from "../../genshin/model/gsCfg.js";
import moment from 'moment';
import _ from 'lodash';

class commonTools {
  constructor () {
    this._path = process.cwd();
    this.rolePicPath = `${pluginPath}/resources/img/role/`;
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
      profilePic: this.rolePicPath,
      quality: 100,
			...data,
		}
		return render;
	}
  
  /** 下载文件 */
  async download (url, path) {
    let res = await fetch(url);
    if (res.ok) {
      return await common.downFile(url, path);
    }
  }

  travelerID () {
    return ['10000005', '10000007', '20000000'];
  }

  /** 主角特殊处理 */
  traveler (alias, name, type) {
    let travelers = ['风主', '岩主', '雷主', '草主'];
    if (!travelers.includes(alias)) {
      travelers = _.map(travelers, (v) => `${v}${type}`);
      return `请选择${name}${type}：${_.join(travelers, '、')}`;
    } else {
      return alias;
    }
  }
}

export default new commonTools();