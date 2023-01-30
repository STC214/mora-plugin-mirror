// import { getWeibo,updateWeiboList } from './weibo.js';
// export {
//   getWeibo,
//   updateWeiboList,
  
// };

// 指令规则
let rule = {
  getWeibo: {
    reg: "^#微博$",
    priority: 4003,
    describe: "微博订阅推送",
  },
  updateWeiboList: {
    reg: "^#*(订阅|增加|新增|移除|去除|取消)微博\\s*.*$",
    priority: 4005,
    describe: "添加或删除微博推送UID",
  },	
};


export { rule };