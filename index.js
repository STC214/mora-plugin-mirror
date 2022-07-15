import { listMeme, } from './apps/zhiAssist.js';
import { moraVersion } from './components/Changelog.js';
export {
	listMeme,
};

// 指令规则
let rule = {
	listMeme: {
    reg: "^#*表情列表*$",
    priority: 5004,
    describe: "【表情列表】添加表情列表",
  },
};

console.log(`摩拉插件${moraVersion}初始化结束~`);

export { rule };