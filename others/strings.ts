import path from "path";
let execPath: string = (path.resolve("./")).replace(/\\/g, "/")
let strings = {
    workPath: execPath,
    noteSpace: execPath + "/2.我的笔记",
    reviewSpace: execPath + "/1.今日复习（拷贝复习）",
    trashBin: execPath + "/3.回收箱",
    noteDataPath: execPath + "/学习记录.json"
};
export default strings;
