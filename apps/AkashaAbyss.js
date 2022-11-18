import plugin from '../../../lib/plugins/plugin.js';
import commonTools from '../model/commonTools.js';
import fetch from 'node-fetch';
import puppeteer from '../../../lib/puppeteer/puppeteer.js';
import gsCfg from '../../genshin/model/gsCfg.js';


export class AkashaAbyss extends plugin {
  constructor () {
    super({
      name: '虚空深渊',
      dsc: '虚空数据库by白猫团队',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: '^#?虚空深渊(五星|四星)?使用率$',
          fnc: 'akashaUsageRate'
        }
      ]
    });
    this.abyss_url = 'https://xkdata.jdsha.com/static/data/abyss_total.js?v=';
    this.myHeaders = new Headers();
    this.myHeaders.append("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.42");
  }

  async akashaUsageRate () {
    let data = await this.getData(this.abyss_url);
    let usageData = {
      abyssVersion: data.schedule_version_desc,
      updateTime: data.modify_time,
    }
    let characterList = data.character_used_list;
    for (let i in characterList) {
      let role = gsCfg.getRole(characterList[i].name);
      characterList[i].name = role.name;
    }
    usageData['characterList'] = characterList;
    let render = await commonTools.getRenderData('AkashaAbyss', usageData);
    let img = await puppeteer.screenshot('AkashaAbyss', render);
    if (img) await this.reply(img);
  }

  /**
   * 获取数据
   * @param {String} url 请求地址
   * @returns json数据
   */
  async getData (url) {
    let v = Math.random() * 10;
    url += v;
    console.log(url);
    let response = await fetch(url, { headers: this.myHeaders, method: 'get', redirect: 'follow' });
    if (!response.ok) {
      return false;
    }
    
    let res = await response.text();
    res = JSON.parse(res.split('=')[1]);
    return res;
  }
}