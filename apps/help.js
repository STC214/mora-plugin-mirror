import plugin from '../../../lib/plugins/plugin.js';
import moracfg from '../model/config.js';
import { pluginPath } from '../components/index.js';
import commonTools from '../model/commonTools.js';
import puppeteer from '../../../lib/puppeteer/puppeteer.js';

export class moraHelp extends plugin {
  constructor () {
    super ({
      name: '摩拉帮助',
      dsc: '摩拉插件帮助',
      event: 'message',
      priority: 5,
      rule: [
        {
          reg: '^#摩拉帮助$',
          fnc: 'moraHelp'
        }
      ]
    })
    this.path = `${pluginPath}/config/default/`;
  }

  async moraHelp() {
    let help = moracfg.getfileYaml(this.path, 'help');
    help['isMaster'] = this.e.isMaster;
    help['iconPath'] = `${pluginPath}/resources/img/icons/`
    let render = await commonTools.getRenderData('Help', 'help', help);
    let img = await puppeteer.screenshot('moraHelp', render);
    if (img) await this.reply(img);
  }
}