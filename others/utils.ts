import fs from "fs";
import crypto from "crypto";
import strings from "./strings";
// 获取指定目录下的所有文件
// 参数    path    callback    recursion
// 备注    路径    处理文件回调    是否递归
function dirRecursion(directory: string, callback: Function, deleteEmptyDir: boolean = false): Array<string> {
    directory = directory.replace(/\\/g, "/");
    // 遍历目录下的文件
    let list: Array<string> = fs.readdirSync(directory);
    for (let i = 0, len = list.length; i < len; i++) {
        let fileName: string = list[i];
        let filePath: string = `${directory}/${list[i]}`;
        // 获取文件信息
        let stat: fs.Stats = fs.statSync(filePath);
        // 对文件和文件夹进行不同的处理
        if (stat.isFile()) {
            // 回调函数处理文件
            callback({
                fileName,
                filePath,
                directory,
                type: "file"
            });
        } else {
            // 继续递归
            let childList: Array<string> = dirRecursion(filePath, callback, deleteEmptyDir);
            if (deleteEmptyDir && childList.length == 0) {
                // 删除空文件夹
                fs.rmdirSync(filePath);
                // 删除数组当前的元素后
                list.splice(i, 1);
                // 需要重新修改循环的 下表位置 和 数组长度
                i-- , len--;
            } else {
                // 回调函数处理文件夹
                callback({
                    fileName,
                    filePath,
                    directory,
                    type: "dir",
                    list: childList
                });
            }
        }
    }
    // 在删除空文件模式下，返回最新目录下的文件列表，以防止出现特殊情况无法删除空文件夹
    if (deleteEmptyDir) {
        return fs.readdirSync(directory);
    } else {
        return list;
    }
}
// 获取指定区间的字符
function getCharBetween(start: number, end: number): Array<string> {
    let chars: Array<string> = [];
    for (let i = start; i <= end; i++) {
        chars.push(String.fromCharCode(i));
    }
    return chars;
}
// 在指定目录下创建深度文件夹
function createDeepDir(path: string, root: string) {
    // 如果包含root，则自动去掉path中的root
    if (path.indexOf(root) == 0) { path = path.replace(root, ""); }
    let paths: Array<string> = path.split("/");
    for (let i = 0, len = paths.length; i < len; i++) {
        root = root + "/" + paths[i];
        createDirs(root);
    }
}
// 创建文件夹
function createDirs(...paths: Array<string>) {
    // 循环创建多个路径
    paths.forEach(path => {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    });
}
// 时间格式化
function dateFormat(fmt: string, date: Date):string {
    let ret:any;
    let opt: any = {
        "Y+": date.getFullYear().toString(),        // 年
        "m+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "H+": date.getHours().toString(),           // 时
        "M+": date.getMinutes().toString(),         // 分
        "S+": date.getSeconds().toString()          // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        };
    };
    return fmt;
}
// 获取两个日期之间的天数
function getDaysBetween(strDateStart: string, strDateEnd: string): number {
    var strSeparator: RegExp = new RegExp("[,\\.\\-，：]"); //日期分隔符
    var oDate1: any;
    var oDate2: any;
    var iDays:number;
    oDate1 = strDateStart.split(strSeparator);
    oDate2 = strDateEnd.split(strSeparator);
    var strDateS = new Date(oDate1[0], oDate1[1] - 1, oDate1[2]);
    var strDateE = new Date(oDate2[0], oDate2[1] - 1, oDate2[2]);
    iDays = (strDateE.getTime() - strDateS.getTime()) / 1000 / 60 / 60 / 24;// 把相差的毫秒数转换为天数
    return iDays;
}
// 往后几天取时间
function getDay(day: number = 0, date: string | null = null): string {
    var today: Date = date == null ? new Date() : new Date(date);
    var targetday_milliseconds: number = today.getTime() + 1000 * 60 * 60 * 24 * day;
    today.setTime(targetday_milliseconds); // 注意，这行是关键代码
    var tYear: number = today.getFullYear();
    var tMonth: number | string = today.getMonth();
    var tDate: number | string = today.getDate();
    tMonth = doHandleMonth(tMonth + 1);
    tDate = doHandleMonth(tDate);
    return tYear + "-" + tMonth + "-" + tDate;
}
function doHandleMonth(month: number): string {
    var m: string = month.toString();
    if (month.toString().length == 1) {
        m = "0" + month.toString();
    }
    return m;
}
// 获取文件信息
function getPathInfo(path: string): any {
    path = path.replace(/\\/g, "/");
    // 正则表匹配 文件、文件夹
    let reg: RegExp = /^(.*)[\\/]([^\\/]+)(\.[^.]+)$|^(.*)[\\/]([^\.\\/]+)$/;
    // 匹配括号的结果      $1        $2        $3    |   $4          $5
    // 前三个是有后缀的，后两个是没后缀的
    let result: any = reg.exec(path);
    if (result) {
        let filePath: string = result[0];
        let directory: string = result[1] ? result[1] : result[4];
        let name: string = result[2] ? result[2] : result[5];
        let extension: string = result[3] ? result[3] : "";
        return {
            name,
            directory,
            filePath,
            extension
        };
    } else {
        return null;
    }
}
// 获取MD5
function getFileMd5(path: string) {
    // 读取文件的Buffer
    let data: Buffer = fs.readFileSync(path);
    // 获取文件的md5
    return crypto.createHash('md5').update(data).digest('hex');
}
// 将文件移动到回收站
function toTrashBin(path: string) {
    let { name, directory, filePath, extension } = getPathInfo(path);
    let count:number = 0;
    let trashName:string = `${strings.trashBin}/${name} - ${count}${extension}`;
    while(fs.existsSync(trashName)){
        trashName = `${strings.trashBin}/${name} - ${++count}${extension}`
    }
    // 把文件放入回收箱
    fs.renameSync(path, trashName);
    // 高亮提醒
    console.log('\x1B[31m%s\x1B[0m:', "回收文件", path.replace(new RegExp(`^(${strings.noteSpace}|${strings.reviewSpace})`),""));
}
export {
    dirRecursion,
    getCharBetween,
    createDeepDir,
    getDay,
    getDaysBetween,
    getPathInfo,
    getFileMd5,
    dateFormat,
    createDirs,
    toTrashBin
}
