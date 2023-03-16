import moraBase from "./moraBase.js";
import moraCfg from './config.js';
import _ from 'lodash';
import moment from 'moment';

export default class breadShop extends moraBase {
  constructor () {
    super();
    this.model = 'breadShop';
    this.cfg = moraCfg.getSetYaml('breadShop');
    this.stuff = this.cfg.stuff;
    this.unit = this.cfg.unit;
  }

  async shop (data) {
    let cache = JSON.parse(await redis.get(`${this.prefix}${data.group_id}`)) || {}
    let _cm = data.msg.replace(this.stuff, '');
    let num = _.random(10);
    let lucky = _.random(1);
    let cd = _.random(10, 60);
    let qq = data.user_id;
    let self = cache[qq] || {};
    let refreshTime = self?.cd || 0;
    let own = cache[qq]?.own || 0;


    if (!cache[qq]) {
      cache[qq] = {};
      cache[qq].name = data.name;
    }

    let res = '';
    switch (_cm) {
      case '买':
        if (Date().now() <= refreshTime) {
          return `还有 ${moment(refreshTime).diff(moment(), 'minutes')} 分钟才能${data.msg}！`;
        }
        
        if (!num) {
          res = `太倒霉了，${this.stuff}卖完了！`;
        } else if (lucky && own < 10) {
          res = `看你${this.stuff}太少了，送了你${num * 2}${this.unit}!`
        } else {
          own += num;
          res = `成功购买了${num}${this.unit}${this.stuff}，`;
        }

        cache[qq].own = own;
        res += `现在一共拥有${own}${this.unit}${this.stuff}！`
        res += this.getRank(cache, qq);
        cache[qq].buyCD = +moment().add(cd, 'm');
        break;
      case '啃':
      
        break;
      case '抢':
      
        break;
      case '送':
      
        break;
      case '赌':
      
        break;
      case '记录':
      
        break;
      case '查看':
      
        break;
      case '排行':
        res = this.getRank(cache);
        break;
      default:
        break;
    }
    await redis.set(`${this.prefix}${data.group_id}`, JSON.stringify(cache));
    return res;
  }

  getRank (cache, qq = '') {
    let _cache = _.map(cache, v => v);
    let ranks = _.orderBy(_cache, ['level', 'own'], ['desc', 'desc']);
    let msg = '';
    
    if (qq) {
      let rank = _.findIndex(ranks, (v) => _.isEqual(v.name, cache[qq].name));
      msg = `您在本群的排名为：${rank + 1}`;
    } else {
      let ranksInfo = _.map(ranks, (v, idx) => `top${idx+1}：${v.name} Lv.${v.level}，拥有${this.stuff}${v.own}${this.unit}`);
      msg = [`本群${this.stuff}排行TOP5`, ..._.take(ranksInfo, 5), '大家继续加油！'].join('\n');
    }

    return msg;
  }
}