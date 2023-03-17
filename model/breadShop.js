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
    const getCache  = JSON.parse(await redis.get(`${this.prefix}${data.group_id}`)) || {};
    let cache = _.cloneDeep(getCache);  // 深拷贝以免影响源数据
    const _cm = data.msg.replace(this.stuff, '');
    const qq = data.user_id;
    const qqs = _.keys(cache);
    const others = _.without(qqs, qq);

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

      refresh = _.random(1);
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
      } else if (lucky && refresh) {
        res = `成功吃掉了${num}${this.unit}${this.stuff}！还是好饿，还可以继续吃`;
      } else if (lucky && !refresh) {
        res = `成功吃掉了${num}${this.unit}${this.stuff}！现在你还剩${own}${this.unit}${this.stuff}！您目前的等级为Lv.${lv}`;
        cache[qq].eat.cd = +moment().add(cd, 'm');
      } else if (!lucky && refresh) {
        res = `成功吃掉了${num}${this.unit}${this.stuff}！让你充满了力量！刷新抢的冷却！`;
        cache[qq].eat.cd = +moment().add(cd, 'm');
        cache[qq].rob.cd = +moment();
      } else {
        res = `成功吃掉了${num}${this.unit}${this.stuff}！吃太多啦，撑死了！下次吃多等30分钟`;
        cache[qq].eat.cd = +moment().add(cd + 30, 'm');
      }
      cache[qq].own = own;
      cache[qq].eaten = eaten;
      cache[qq].Lv = lv;
      cache[qq].eat.record += 1;
    } else if (_cm.includes('抢')) {
      refresh = this.refreshTime(cache[qq], 'rob', data.msg);
      if (refresh) return refresh;
      
      let at = data.at || _.sample(others);
      if (!num && !cache[at].own) {
        res = `太饿了！什么都没抢到，但是你想吃东西！吃${this.stuff}冷却刷新！`;
        cache[qq].eat.cd = +moment();
        cache[qq].rob.cd = +moment().add(cd, 'm');
      } else if (!num) {
        res = `你抢${this.stuff}被警察抓住了！你真的太坏了！下次抢${this.stuff}时间多等40min！`;
        cache[qq].rob.cd = +moment().add(cd + 40, 'm');
      } else if (lucky) {
        num = cache[at].own >= num ? num : cache[at].own;
        own += num; 
        cache[at].own -= num;
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

      if (!own) return `没有${this.stuff}了捏`;

      let bet = _cm.replace(/赌| |"|“|”/g, '');
      let rps = ['石头', '剪刀', '布'];
      let bet_idx = _.findIndex(rps, v => v === bet);
      if (!bet || bet_idx === -1) return false;

      let guess = _.random(2);
      if (!num) {
        res = `你赌${this.stuff}被警察抓住了！你不赌，我不赌，和谐幸福跟我走！下次赌${this.stuff}时间多等40min！`;
        cache[qq].bet.cd = +moment().add(cd + 40, 'm');
      } else if ( bet_idx === guess ) {
        res = `${rps[guess]}！平局啦！${this.stuff}都还给你啦！还可以再来一次！`;
      } else if ( bet_idx === guess+1 || (bet_idx === 0 &&  guess === 2)) {
        if (!own) {
          res = `${rps[guess]}！嘿嘿，我赢啦！什么？没有${this.stuff}还敢来赌！留下来洗厕所！！！下次赌${this.stuff}冷却时间翻倍！`;
          cache[qq].bet.cd = +moment().add(cd * 2, 'm');
        } else {
          num = own >= num ? num : own;
          own -= num;
          res = `${rps[guess]}！嘿嘿，我赢啦！你的${num}${this.unit}${this.stuff}归我了！你现在拥有${own}${this.unit}${this.stuff}！`;
          cache[qq].bet.cd = +moment().add(cd, 'm');
        }
      } else {
        own += num;
        res = `${rps[guess]}！呜呜，我输了，给你${num}${this.unit}${this.stuff}！你现在拥有${own}${this.unit}${this.stuff}！`;
        cache[qq].bet.cd = +moment().add(cd, 'm');
      }

      cache[qq].own = own;
      cache[qq].bet.record += 1;
    } else if (_cm.includes('送')) {
      refresh = this.refreshTime(cache[qq], 'give', data.msg);
      if (refresh) return refresh;

      if (!own) return `没有${this.stuff}了捏`;

      let at = data.at || _.sample(others);
      if (!num) {
        res = `${this.stuff}送不出去捏`;
      } else if (lucky) {
        num = own >= num ? num : own;
        own -= num;
        cache[at].own += num;
        res = `成功赠送了${num}${this.unit}${this.stuff}给${cache[at].name}，你现在${own}${this.unit}${this.stuff}！${cache[at].name}有${cache[at].own}${this.unit}${this.stuff}！`;
        cache[qq].give.cd = +moment().add(cd, 'm');
      } else {
        num = own >= num ? num : own-1;
        own -= num;
        cache[at].own += num;

        let num2 = _.random(1, 10);
        num2 = own >= num2 ? num2 : own;
        own -= num2;

        res = `哇！这么多${this.stuff}，你送了${num}${this.unit}给${cache[at].name}！再给我${num2}${this.unit}吧嘿嘿！你现在有${own}${this.unit}${this.stuff}！`;
        cache[qq].give.cd = +moment().add(cd, 'm');
      }
      cache[qq].own = own;
      cache[qq].give.record += 1;
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

  getRank (data, qq = '') {
    if (_.isEmpty(data)) {
      return `本群暂无排行，买点${this.stuff} 8`;
    }
    let _cache = _.map(data, v => v);
    let ranks = _.orderBy(_cache, ['Lv', 'own'], ['desc', 'desc']);
    let msg = '';

    if (qq) {
      let rank = _.findIndex(ranks, (v) => _.isEqual(v.name, data[qq].name));
      msg = `您在本群的排名为：${rank + 1}`;
    } else {
      let ranksInfo = _.map(ranks, (v, idx) => `top${idx+1}：${v.name} Lv.${v.Lv}，拥有${this.stuff}${v.own}${this.unit}`);
      msg = [`本群${this.stuff}排行TOP5`, ..._.take(ranksInfo, 5), '大家继续加油！'].join('\n');
    }

    return msg;
  }

  refreshTime(self, prop, msg) {
    let cd = _.get(self, [prop, 'cd'], 0);;
    if (+moment() <= cd) {
      return `还有 ${moment(cd).diff(moment(), 'minutes')} 分钟才能${msg}！`;
    } else {
      return false;
    }
  }
}