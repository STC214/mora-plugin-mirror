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
        },
        {
          reg: '^#?虚空深渊数据$',
          fnc: 'akashaAnalysis'
        }
      ]
    });
    this.abyss_url = 'https://akashadata.com/static/data/abyss_total.js?v=';
    this.myHeaders = new Headers();
    this.myHeaders.append("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.42");
  }

  /**
   * 使用率
   */
  async akashaUsageRate () {
    // 稀有度
    let rarity = /^#?虚空深渊(五星|四星)?使用率$/.exec(this.e.msg)[1];
    if (rarity === "五星") {
      rarity = 5;
    } else if (rarity === "四星") {
      rarity = 4;
    }

    let data = await this.getData(this.abyss_url);    

    let usageData = {
      abyssVersion: data.schedule_version_desc,
      updateTime: data.modify_time,
      characterList: this.listFilter(data.character_used_list, rarity),
    }
    let render = await commonTools.getRenderData('Akasha', 'abyss', usageData);
    let img = await puppeteer.screenshot('AkashaAbyss', render);
    if (img) await this.reply(img);
  }

  /**
   * 数据总览
   */
  async akashaAnalysis () {
    let data = await this.getData(this.abyss_url);

    let fullMarkRate = data.level_data.player_level_data.maxstar_player_data;
    let throughoutRate = data.level_data.player_level_data.pass_player_data;
    let variousLevels = data.level_data.palyer_count_level_data;
    let rateChart = [];
    let levelChart = [];
    for (let i = 0 ; i < 11 ; i++ ) {
      rateChart.push(
        {
          'level': throughoutRate.x_list[i],
          'rate': throughoutRate.y_list[i],
          'title': throughoutRate.title
        }
      );
      rateChart.push(
        {
          'level': fullMarkRate.x_list[i],
          'rate': fullMarkRate.y_list[i],
          'title': fullMarkRate.title
        }
      );
      levelChart.push(
        {
          'level': variousLevels.level_data[i],
          'players': variousLevels.player_count_data[i]
        }
      );
    }

    let analyzeData = {
      abyssVersion: data.schedule_version_desc,
      updateTime: data.modify_time,
      abyssData: data.abyss_total_view,
      dataVaries: data.last_rate,
      rateChartData: JSON.stringify(rateChart),
      levelChartData: JSON.stringify(levelChart),
    }
    let render = await commonTools.getRenderData('Akasha', 'analysis', analyzeData);
    let img = await puppeteer.screenshot('AkashaAnalysis', render);
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

  /**
   * 筛选数据
   * @param {Array} list 原数据
   * @param {Number} rarity 稀有度(筛选条件)
   * @returns 筛选后的数据
   */
  listFilter (list, rarity) {
    let rarityList = [];
    for (let i in list) {
      let role = gsCfg.getRole(list[i].name);
      list[i].name = role.name;
      if (list[i].rarity === rarity) {
        rarityList.push(list[i]);
      }
    }
    if (rarity) {
      list = rarityList;
    }

    return list;
  }
}