import { listMeme, addMeme, addMemeContext } from './zhiAssist.js';
import { getWeibo } from './weibo.js';
import { updateMoraPlugin} from './update.js';
export {
	listMeme,
  addMeme,
  addMemeContext,
  updateMoraPlugin,
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
  updateMoraPlugin: {
    reg: "^#*(摩拉更新|更新摩拉插件)$",
    priority: 5,
    describe: "更新摩拉插件",
  },
	
};


export { rule };