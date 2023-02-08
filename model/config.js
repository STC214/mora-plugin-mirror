import YAML from 'yaml'
import chokidar from 'chokidar'
import fs from 'node:fs'
import { promisify } from 'node:util'
import lodash from 'lodash'
import { Data, isV3, pluginPath } from "../components/index.js";

// const plugin = "mora-plugin"
// const pathPlugin=`./plugins/${plugin}/data/`
/**
 * 配置文件
 * 借鉴逍遥插件
 */
class moracfg {
	constructor () {
		this.def = `${pluginPath}/config/default/`;
		this.user = `${pluginPath}/config/user/`;
	}

	/** 通用yaml读取*/
	getfileYaml (path, name) {
		return YAML.parse(
			fs.readFileSync(path + name + ".yaml", 'utf8')
		);
	}

	/** 设置读取 */
	getSetYaml (name, isCopy = false) {	
		if (isCopy) {
			this.defSetCopy(name);
		}

		let setYaml = {};
		if (!fs.existsSync(`${this.user + name}.yaml`)) {
			setYaml = this.getfileYaml(this.def, name);
		} else {
			setYaml = this.getfileYaml(this.user, name);
		}

		return setYaml;
	}

	/** 配置拷贝 */
	defSetCopy (name) {
		name += '.yaml';
		if (!fs.existsSync(this.user)) {
			fs.mkdirSync(this.user)
		}
		if (!fs.existsSync(this.user + name)) {
			fs.copyFileSync(this.def + name, this.user + name);
		}
	}

	getMoraPath (name) {
		let path = pluginPath;
		switch (name) {
			case 'def':
				path = this.def;
				break;
			case 'user':
				path = this.user;
				break;
			case 'res':
				path += '/resources/';
				break;
			case 'plus':
				path += '/resources/mora-plugin-res/';
				break;
			case 'data':
				path += '/data/';
				break;
		}
		return path;
	}

	getMoraPlus (name) {
		let path = this.getMoraPath('plus');
		switch (name) {
			case 'banner':
				path += 'GenshinBanners'
				break;
			case 'role':
				path += 'Roles'
				break;
			case 'team':
				path += 'TeamGuides'
				break;
			case 'abyss':
				path += 'Abyss'
				break;
		}
		return path;
	}

	async getWeiboYaml(userId){
		try {
			let ulist = YAML.parse(
				fs.readFileSync(`plugins/${plugin}/data/weibo/${userId}.yaml`, 'utf8')
			);
			return ulist || {};
		}catch (err) {
			return {};
		}
	}

	/** 读取所有用户配置 */
	async getConfigAll() {
		let cfglist = [];
		let dir = `/plugins/${plugin}/data/weibo/`;
		let files = fs.readdirSync(dir).filter(file => file.endsWith('.yaml'));

		const readFile = promisify(fs.readFile);

		let promises = []

		files.forEach((v) => promises.push(readFile(`${dir}${v}`, 'utf8')));
		const res = await Promise.all(promises);
		res.forEach((v, index) => {
			let tmp = YAML.parse(v);
			cfglist.push(tmp);
		})
		return cfglist;
	}

	/** 读取单个用户配置 */
	getConfigOne(userId) {
		let file = `./plugins/${plugin}/data/weibo/${userId}.yaml`;
		try {
			let cfglist = fs.readFileSync(file, 'utf-8');
			cfglist = YAML.parse(cfglist);
			return cfglist;
		} catch (error) {
			return {};
		}
	}

	/** 读取用户订阅列表 */
	getWeiboList(userId) {
		let file = `./plugins/${plugin}/data/weibo/${userId}.yaml`;
		try {
			let cfglist = fs.readFileSync(file, 'utf-8');
			cfglist = YAML.parse(cfglist);
			cfglist = cfglist.weiboPushList;
			return cfglist;
		} catch (error) {
			return {};
		}
	}

	/** 保存订阅列表 */
	saveWeiboList(userId, data) {
		let file = `./plugins/${plugin}/data/weibo/${userId}.yaml`
		if (lodash.isEmpty(data)) {
			fs.existsSync(file) && fs.unlinkSync(file)
		} else {
			fs.exists(file, (exists) => {
				if (!exists) {
					fs.writeFileSync(file, "", 'utf8')
				}
				let wlist = fs.readFileSync(file, 'utf-8');
				let yaml = YAML.stringify(data);
				wlist = YAML.parse(wlist);

				if (wlist?.weiboId||!wlist) {	//wlist 空
					fs.writeFileSync(file, yaml, 'utf8')
				} else {
					/** 订阅列表整理 */
					let weiboPushList = wlist.weiboPushList;	// 获取配置文件订阅列表
					weiboPushList = weiboPushList.concat(data.weiboPushList);	// 合并新微博用户
					wlist["weiboPushList"] = weiboPushList;	// 写入wlist
					wlist = YAML.stringify(wlist);
					fs.writeFileSync(file, wlist, 'utf8');
					/**if(!wlist[Object.keys(data)[0]]){ //wlist键为 空
						wlist = YAML.stringify(wlist)
						fs.writeFileSync(file, yaml + wlist, 'utf8')
						logger.info(`[判断] ?：${wlist[Object.keys(data)[0]]}`);
					} else {

					}*/
				}
			})
		}
	}
}


export default new moracfg()
