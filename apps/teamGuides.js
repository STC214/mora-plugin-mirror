import plugin from '../../../lib/plugins/plugin.js';
import common from '../../../lib/common/common.js';
import fs from 'node:fs';
import _ from 'lodash';
import { segment } from 'oicq';
import gsCfg from '../../genshin/model/gsCfg.js';
import moracfg from '../model/config.js';

export class teamGuides extends plugin {
  constructor () {
    super ({
      name: '角色配队一图流',
      dsc: '角色配队一图流 @茗血茶',
      event: 'message',
      priority: 5,
      rule: [
        {
          reg: '^#\\S+配队$',
          fnc: 'teamGuides'
        }
      ]
    })
    this.path = moracfg.getMoraPlus('team');
    this.file = 'teamGuides.yaml';
  }
  

  async teamGuides () {
    if (!fs.existsSync(this.path)) {
      await this.e.reply('还没下载资源包，配队功能用不了捏');
      return false;
    }

    let query = /^#(\S+)配队$/.exec(this.e.msg)[1];
    if (_.includes(query, '深渊')) {
      return false;
    }

    let teams = moracfg.getfileYaml(this.path, 'teamGuides');
    teams = await this.searchTeams(teams, query);
    
    if (!_.isEmpty(teams.traveler)) {
      await this.e.reply(teams.traveler);
      return false;
    }
    if (!teams.find) {
      await this.e.reply(`暂无${query}配队`);
      return false;
    }

    teams = _.map(_.castArray(teams.find), (v) => `茗血茶/${v}.png`);
    let msg = []
    for (const team of teams) {
      let path = `${this.path}/${team}`;
      if (fs.existsSync(path)) {
        msg.push(segment.image(`file://${path}`));
      }
    }

    if (_.isEmpty(msg)) {
      logger.error(`图片获取失败`);
      return false;
    }

    if (msg.length > 1) {
      await this.e.reply(await common.makeForwardMsg(this.e, msg, `${query}配队详情`));
    } else {
      await this.e.reply(msg[0]);
    }

    return true;
  }

  searchTeams (teams, query) {
    let names = _.keys(teams);

    let find = _.includes(names, query);
    if (!find && _.endsWith(query, '队')) {
      query = _.replace(query, '队', '');
      find = _.includes(names, query);
    }
    names = query;

    if (!find) {
      let alias = _.mapValues(teams, 'alias');
      alias = _.pickBy(alias, (v) => v.includes(query));
      names = _.keys(alias);
      find = !_.isEmpty(names);
    }

    let traveler = '';
    if (!find) {
      let role = gsCfg.getRole(query);
      if(!role) return false;
      /** 主角特殊处理 */
      if (['10000005', '10000007', '20000000'].includes(String(role.roleId))) {
        let travelers = ['风主', '岩主', '雷主', '草主'];
        if (!travelers.includes(role.alias)) {
          travelers = _.map(travelers, (v) => `${v}配队`);
          traveler = `请选择${query}配队：${_.join(travelers, '、')}`;
          find = false;
        } else {
          role.name = role.alias;
        }
      }
      let roles = _.mapValues(teams, 'role');
      roles = _.pickBy(roles, (v) => v.includes(role.name));
      names = _.keys(roles);
      find = !_.isEmpty(names);
    }

    return {
      find: find ? names : find,
      traveler: traveler
    }
  }
}