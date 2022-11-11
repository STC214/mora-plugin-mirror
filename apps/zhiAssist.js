import plugin from "../../../lib/plugins/plugin.js";
import cfg from '../../../lib/config/config.js';
import common from '../../../lib/common/common.js';
import fs from 'fs';
import { randomApply }  from "../../zhi-plugin/apps/randomApply.js";

export class zhiAssist extends plugin {
	constructor () {
		super({
			name: '白纸辅助',
			dsc: '白纸表情辅助',
			event: 'message',
			priority: 5,
			rule: [
				{
					reg: '^#添加(.*)',
					fnc: 'addMeme'
				},
				{
					reg: '^#*随机表情列表$',
					fnc: 'listMeme'
				}
			]
		})
		//getTextData();
		this.path = './data/randomApply/randomApply.json';
	}
	
	/**
	 * 获取随机表情列表
	 */
	async listMeme() {
		let faceList = JSON.parse(fs.readFileSync(this.path,'utf-8'));
		let faceArr = []
		let count = 0;

		// 关键词列表添加序号
		for(let i in faceList){
			count += 1;
			faceArr.push(`${count}. ${i}`);
		}

		if(faceArr.length <= 0){
			this.e.reply('暂无表情');
			return;
		}

		// 合并发送
		let msg = [];
		msg.push(faceArr.join('\r\n'));
		msg = await common.makeForwardMsg(this.e, msg, '随机表情列表~');
		await this.e.reply(msg);

		return true;
	}
	
	/** 
	 * * 加入权限控制 (引用云崽配置 )
	 * 白纸插件：https://gitee.com/headmastertan/zhi-plugin
	 * 原插件如果有相关功能的话，本插件会进行删除
	 */
	async addMeme (e) {
		if ( !this.checkAuth() ) return;
		await randomApply(e);
	}

	// 权限检查
	checkAuth () {
    if (this.e.isMaster) return true;

    let groupCfg = cfg.getGroup(this.group_id);
    if (groupCfg.imgAddLimit == 2) {
      this.e.reply('暂无权限，只有主人才能操作');
      return false;
    }
    if (groupCfg.imgAddLimit == 1) {
      if (!Bot.gml.has(this.group_id)) {
        return false;
      }
      if (!Bot.gml.get(this.group_id).get(this.e.user_id)) {
        return false;
      }
      if (!this.e.member.is_admin) {
        this.e.reply('暂无权限，只有管理员才能操作');
        return false;
      }
    }

    if (!this.e.isGroup && groupCfg.addPrivate != 1) {
      this.e.reply('禁止私聊添加');
      return false;
    }

    return true;
  }
}

/** 
// 获取随机回复列表
function getTextData() {
  textArr = new Map();
  bakeTextArr = new Map();

  if (!fs.existsSync(JSON_PATH)) {
    fs.writeFileSync(JSON_PATH, JSON.stringify({}, "", "\t"));
    return;
  }

  if (!fs.existsSync(BAKE_JSON_PATH)) {
    fs.writeFileSync(BAKE_JSON_PATH, JSON.stringify({}, "", "\t"));
    return;
  }

  let textJson = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  let bakeTextJson = JSON.parse(fs.readFileSync(BAKE_JSON_PATH, "utf8"));
  textArr = new Map(Object.entries(textJson));
  bakeTextArr = new Map(Object.entries(bakeTextJson));
}
*/
