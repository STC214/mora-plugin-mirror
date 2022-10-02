import YAML from 'yaml'
import chokidar from 'chokidar'
import fs from 'node:fs'
import { promisify } from 'node:util'
import lodash from 'lodash'
import { Data, isV3 } from "../../components/index.js";

const plugin = "mora-plugin"
const pathPlugin=`./plugins/${plugin}/data/`
/**
 * 配置文件
 * 借鉴逍遥插件
 */
class moracfg {
	constructor() {

	}
	/** 通用yaml读取*/
	getfileYaml(path, name) {
		return YAML.parse(
			fs.readFileSync(path + name + ".yaml", 'utf8')
		);
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

	/** 读取所有用户订阅列表 */
	async getWeiboListAll() {
		let wlist = [];
		let dir = `/plugins/${plugin}/data/weibo/`;
		let files = fs.readdirSync(dir).filter(file => file.endsWith('.yaml'));

		const readFile = promisify(fs.readFile);

		let promises = []

		files.forEach((v) => promises.push(readFile(`${dir}${v}`, 'utf8')));
		const res = await Promise.all(promises);
		res.forEach((v, index) => {
			let tmp = YAML.parse(v);
			wlist.push(tmp);
		})
		return wlist;
	}

	/** 读取单个用户订阅列表 */
	getWeiboListOne(userId) {
		let file = `./plugins/${plugin}/data/weibo/${userId}.yaml`;
		try {
			let wlist = fs.readFileSync(file, 'utf-8');
			wlist = YAML.parse(wlist);
			return wlist;
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
				let wlist = fs.readFileSync(file, 'utf-8')
				let yaml = YAML.stringify(data)
				wlist = YAML.parse(wlist)
				if (wlist?.uid||!wlist) {
					fs.writeFileSync(file, yaml, 'utf8')
				} else {
					if(!wlist[Object.keys(data)[0]]){
						wlist = YAML.stringify(wlist)
						fs.writeFileSync(file, yaml + wlist, 'utf8')
					}
				}
			})
		}
	}
}


export default new moracfg()
