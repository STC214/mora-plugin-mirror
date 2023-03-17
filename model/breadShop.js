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
    const getCache  = JSON.parse(await redis.get(`${this.prefix}${data.group_id}`)) || {}
    let cache = getCache;
    const _cm = data.msg.replace(this.stuff, '');
    const qq = data.user_id;
    const qqs = _.pull(_.keys(cache), qq);

    const lucky = _.random(1);
    const cd = _.random(10, 60);
    let num = _.random(10);
    let own = cache[qq]?.own || 0;

    if (!cache[qq]) {
      cache[qq] = {
        name: data.name,
        Lv: 0,
        eaten: 0,
        buy: {
          cd: 0,
          record: 0
        },
        eat: {
          cd: 0,
          record: 0
        },
        rob: {
          cd: 0,
          record: 0
        },
        bet: {
          cd: 0,
          record: 0
        },
        give: {
          cd: 0,
          record: 0
        }
      };
    }

    let res = '';
    let refresh = '';
    if (_cm === '买') {
      refresh = this.refreshTime(cache[qq], 'buy', data.msg);
      if (refresh) return refresh;
      
      if (!num) {
        res = `太倒霉了，${this.stuff}卖完了！`;
      } else if (lucky && own < 10) {
        own += num * 2;
        res = `看你${this.stuff}太少了，送了你${num * 2}${this.unit}!`
      } else {
        own += num;
        res = `成功购买了${num}${this.unit}${this.stuff}，`;
      }

      cache[qq].own = own;
      res += `现在一共拥有${own}${this.unit}${this.stuff}！`
      res += this.getRank(cache, qq);
      cache[qq].buy.cd = +moment().add(cd, 'm');
      cache[qq].buy.record += 1;
    } else if (['啃', '吃'].includes(_cm)) {
      refresh = this.refreshTime(cache[qq], 'eat', data.msg);
      if (refresh) return refresh;
      if (!own) return `没有${this.stuff}了捏`;

      num = own >= num ? num : own;
      own -= num;
      let lv = cache[qq].Lv;
      let eaten = cache[qq].eaten + num;
      if (eaten >= 10) {
        lv += 1;
        eaten -= 10;
      }

      if (!num) {
        num = _.random(1, 10);
        num = own >= num ? num : own;
        own -= num;
        res = `你吃${this.stuff}被我发现了！我好饿，我帮你吃吧！吃了你${num}${this.unit}${this.stuff}！`;
        cache[qq].eat.cd = +moment().add(cd, 'm');
      } else if (lucky) {
        res = `成功吃掉了${num}${this.unit}${this.stuff}！还是好饿，还可以继续吃`;
      } else {
        res = `成功吃掉了${num}${this.unit}${this.stuff}！现在你还剩${own}${this.unit}${this.stuff}！您目前的等级为Lv.${lv}`;
        cache[qq].eat.cd = +moment().add(cd, 'm');
      }

      cache[qq].own = own;
      cache[qq].eaten = eaten;
      cache[qq].Lv = lv;
      cache[qq].eat.record += 1;
    } else if (_cm.includes('抢')) {
      refresh = this.refreshTime(cache[qq], 'rob', data.msg);
      if (refresh) return refresh;
      
      let at = data.at || _.sample(qqs);
      if (!num || !cache[at].own) {
        res = `你抢${this.stuff}被警察抓住了！你真的太坏了！下次抢${this.stuff}时间多等40min！`;
        cache[qq].rob.cd = +moment().add(cd + 40, 'm');
      } else if (lucky) {
        num = cache[at].own >= num ? num : cache[at].own;
        own += num; 
        res = `成功抢了${cache[at].name}${num}${this.unit}${this.stuff}，你现在拥有${own}${this.unit}${this.stuff}！${this.getRank(cache, qq)}`;
        cache[qq].rob.cd = +moment().add(cd, 'm');
      } else {
        num = own >= num ? num : own;
        own -= num;
        cache[at].own += num;
        res = `抢${this.stuff}失败啦！被${cache[at].name}反击，你丢失${num}${this.unit}${this.stuff}！你现在拥有${own}${this.unit}${this.stuff}！`;
        cache[qq].rob.cd = +moment().add(cd, 'm');
      }
      
      cache[qq].own = own;
      cache[qq].rob.record += 1;
    } else if (_cm.includes('赌')) {
      refresh = this.refreshTime(cache[qq], 'bet', data.msg);
      if (refresh) return refresh;

      let bet = _cm.replace(/赌| /g, '');
      let rps = ['石头', '剪刀', '布'];
      let bet_idx = _.findIndex(rps, bet);
      if (!bet || bet_idx === -1) return false;

      let guess = _.random(2);
      if (!num) {
        res = `你赌${this.stuff}被警察抓住了！你不赌，我不赌，和谐幸福跟我走！下次赌${this.stuff}时间多等40min！`;
        cache[qq].bet.cd = +moment().add(cd + 40, 'm');
      } else if ( bet_idx === guess ) {
        res = `${rps[guess]}！平局啦！${this.stuff}都还给你啦！还可以再来一次！`;
      } else if ( bet_idx === guess+1 || (bet_idx === 2 &&  guess === 0)) {
        num = own >= num ? num : own;
        own -= num;
        res = `${rps[guess]}！嘿嘿，我赢啦！你的${num}${num}${this.unit}${this.stuff}归我了！你现在拥有${own}${this.unit}${this.stuff}！`;
        cache[qq].bet.cd = +moment().add(cd, 'm');
      } else {
        own += num;
        res = `${rps[guess]}！呜呜，我输了，给你${num}${this.unit}${this.stuff}！你现在拥有${own}${this.unit}${this.stuff}！`;
        cache[qq].bet.cd = +moment().add(cd, 'm');
      }

      cache[qq].own = own;
      cache[qq].bet.record += 1;
    } else if (_cm.includes('记录')) {
      return `还没写`;
    } else if (_cm.includes('查看')) {
      return `还没写`;
    } else if (_cm === '排行') {
      return this.getRank(getCache);
    } else {
      return false;
    }
    await redis.set(`${this.prefix}${data.group_id}`, JSON.stringify(cache));
    return res;
  }

  getRank (cache, qq = '') {
    if (_.isEmpty(cache)) {
      return `本群暂无排行，买点${this.stuff} 8`;
    }
    let _cache = _.map(cache, v => v);
    let ranks = _.orderBy(_cache, ['level', 'own'], ['desc', 'desc']);
    let msg = '';

    if (qq) {
      let rank = _.findIndex(ranks, (v) => _.isEqual(v.name, cache[qq].name));
      msg = `您在本群的排名为：${rank + 1}`;
    } else {
      let ranksInfo = _.map(ranks, (v, idx) => `top${idx+1}：${v.name} Lv.${v.Lv}，拥有${this.stuff}${v.own}${this.unit}`);
      msg = [`本群${this.stuff}排行TOP5`, ..._.take(ranksInfo, 5), '大家继续加油！'].join('\n');
    }

    return msg;
  }

  refreshTime(self, prop, msg) {
    let cd = _.get(self, prop.cd, 0);
    if (+moment() <= cd) {
      return `还有 ${moment(cd).diff(moment(), 'minutes')} 分钟才能${msg}！`;
    } else {
      return false;
    }
  }
}