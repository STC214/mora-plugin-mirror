import { listMeme, addMeme, addMemeContext } from './apps/zhiAssist.js';
import { moraVersion } from './components/Changelog.js';
export {
	listMeme,
  addMeme,
  addMemeContext,
};

// 指令规则
let rule = {
	listMeme: {
    reg: "^#*表情列表*$",
    priority: 4000,
    describe: "【表情列表】添加表情列表",
  },
  addMeme: {
    reg: "^#*添加(.*)",
    priority: 4001,
    describe: "【添加哈哈】添加内容",
  },
  addMemeContext: {
    reg: "noCheck",
    priority: 4002,
    describe: "添加随机回复上下文",
  },
	
};

console.log(`摩拉插件${moraVersion}初始化~`);

export { rule };