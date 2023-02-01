import plugin from '../../../lib/plugins/plugin.js';
import common from '../../../lib/common/common.js';
import fs from 'node:fs';
import _ from 'lodash';
import { segment } from 'oicq';
import gsCfg from '../../genshin/model/gsCfg.js';
import moracfg from '../model/config.js'
import commonTools from '../model/commonTools.js';
import { pluginPath } from '../components/index.js';

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
        },
        {
          reg: '^#配队(更新|下载)$',
          fnc: 'updateTeams'
        }
      ]
    })
    this.url = commonTools.getMoraRes('team');
    this.path = `${pluginPath}/data`;
    this.cfgpath = `${pluginPath}/config/user`;
    this.file = 'teamGuides.yaml';
  }
  
  async init () {
    if (!fs.existsSync(this.path)) {
      fs.mkdirSync(this.path);
    }

    let path = `${this.path}/teamGuides`;
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    if (fs.existsSync(`${path}/${this.file}`)) {
      fs.unlinkSync(`${path}/${this.file}`);
    }
    if (!fs.existsSync(`${this.cfgpath}/${this.file}`)) {
      await commonTools.download(this.url + this.file, `${this.cfgpath}/${this.file}`);
    }
  }

  async teamGuides () {
    let query = /^#(\S+)配队$/.exec(this.e.msg)[1];

    let teams = moracfg.getfileYaml(`${this.cfgpath}/`, 'teamGuides');
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
      let url = encodeURI(this.url + team);
      let path = `${this.path}/teamGuides/${team}`;
      if (!fs.existsSync(path)) {
        await commonTools.download(url, path);
      }
      if (fs.existsSync(path)) {
        msg.push(segment.image(`file://${path}`));
      }
    }

    if (_.isEmpty(msg)) {
      logger.error(`图片下载失败`);
      return false;
    }

    if (msg.length > 1) {
      await this.e.reply(await common.makeForwardMsg(this.e, msg, `${query}配队详情`));
    } else {
      await this.e.reply(msg[0]);
    }
  }

  async updateTeams () {
    if (this.e.isMaster || _.includes([289873439, 1767666852], Number(this.e.user_id))){
      await commonTools.download(this.url + this.file, `${this.cfgpath}/${this.file}`);
    } else {
      await this.e.reply('暂无操作权限');
      return false;
    }
    logger.mark("配队更新完成");
    await this.e.reply('配队更新完成');
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