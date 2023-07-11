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
				path += 'Banners'
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
}


export default new moracfg()
