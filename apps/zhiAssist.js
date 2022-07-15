import { segment } from "oicq";
import fetch from "node-fetch";
import fs from 'fs';

//项目路径
const _path = process.cwd();

export const rule = {
  listMeme: {
    reg: "^#*表情列表*$",
    priority: 5004,
    describe: "【表情列表，表情列表1】添加表情列表",
  },
}

export async function listMeme(e){
	if (!e.message) {
		return;
	}
	let path = './data/randomApply/randomApply.json';
	let faceList = JSON.parse(fs.readFileSync(path,'utf-8'));
	let faceArr = []
	let count = 0;
	for(var i in faceList){
			count += 1;
			faceArr.push(count + '.' + i);
	}
	if(faceArr.length <= 0){
			e.reply('暂无表情');
			return true;
	}
	let face = faceArr.join('\r\n');
	e.reply('全部表情：\r\n' + face);
	return true;
}
