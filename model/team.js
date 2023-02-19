import moraBase from "./moraBase.js";
import commonTools from './commonTools.js';
import gsCfg from '../../genshin/model/gsCfg.js';
import _ from 'lodash';
import fs from 'node:fs';
import moracfg from './config.js';
import { segment } from 'oicq';
import common from '../../../lib/common/common.js';

export default class team extends moraBase{
  constructor (e) {
    super(e);
    this.path = moracfg.getMoraPlus('team');
  }

  async guides (query) {
    if (!fs.existsSync(this.path)) {
      await this.e.reply('还没下载资源包，配队功能用不了捏');
      return false;
    }

    let teams = moracfg.getfileYaml(`${this.path}/`, 'teamGuides');
    teams = this.searchTeams(teams, query);

    if (!_.isEmpty(teams.traveler)) {
      await this.e.reply(teams.traveler);
      return false;
    }
    if (!teams.find) {
      await this.e.reply(`暂无${query}配队捏`);
      return false;
    }

    teams = _.map(_.castArray(teams.find), v => `茗血茶/${v}.png`);
    teams = _.filter(teams, v => fs.existsSync(`${this.path}/${v}`));
    if (_.isEmpty(teams)) {
      logger.error(`图片获取失败`);
      await this.e.reply(`没找到捏，是不是没更新资源包捏捏捏捏捏？`);
      return false;
    }

    let msg = _.map(teams, v => segment.image(`file://${this.path}/${v}`));
    if (msg.length > 1) {
      msg = await common.makeForwardMsg(this.e, msg, `${query}配队详情`);
    } else {
      msg = msg[0];
    }

    return msg;
  }

  searchTeams (teams, query) {
    let names = _.keys(teams);

    // 队名
    if (_.endsWith(query, '队')) {
      query = _.replace(query, '队', '');
    }
    let find_tname = _.filter(names, v => v.includes(query));

    // 别名
    let alias = _.mapValues(teams, 'alias');
    alias = _.pickBy(alias, v => v.includes(query));
    let find_alias = _.keys(alias);

    // 角色
    let traveler = '';
    let role = gsCfg.getRole(query);
    if(!role) return false;
    /** 主角特殊处理 */
    if (_.includes(commonTools.travelerID(), String(role.roleId))) {
      traveler = commonTools.traveler(role.alias, query, '配队');
      if (_.isEqual(role.alias, traveler)) {
        role.name = traveler;
        traveler = '';
      }
    }

    let roles = _.mapValues(teams, 'role');
    roles = _.pickBy(roles, v => v.includes(role.name));
    let find_rname = _.keys(roles);

    names = _.uniq(_.concat(find_tname, find_alias, find_rname));
    
    return {
      find: _.isEmpty(names) ? false : names,
      traveler: traveler
    }
  }
}