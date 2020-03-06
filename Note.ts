import db from "../others/db";
import fs from "fs";
import strings from "../others/strings";
import { getDay, getDaysBetween, getPathInfo, createDeepDir, getFileMd5 } from "../others/utils";
import crypto from "crypto";
export default class Note {
    // **********************************************************属性**********************************************************
    // 名字
    private noteName: string | undefined;
    // id
    private id: string | number | undefined;
    // 详情地址
    private filePath: string | undefined;
    // 文件名字
    private fileName: string | undefined;
    // 所在文件夹
    private directory: string | undefined;
    // 笔记工作空间
    private noteSpace: string | undefined;
    // 笔记复习空间
    private reviewSpace: string | undefined;
    // 文件类型
    private extension: string | undefined;
    // 艾宾浩斯目标
    private target: number = 11;
    // 艾宾浩斯当前次数
    private level: number = 0;
    // 第一次
    private startDate: string = getDay(0);
    // 最近的一次
    private latestDate: string = getDay(0);
    // 复习记录
    private history: any = {};
    // **********************************************************构造函数**********************************************************
    constructor()
    constructor(id: string)
    constructor(id: string | number, name: string)
    constructor(x?: string | number, y?: string) {
        // 初始化数据
        // 已存在笔记数据
        if ((typeof x == "string" || typeof x == "number") && typeof y == "string") {
            // 设置Id
            this.setId(x)
                .setNoteName(y);
            // 新创建的笔记
        } else if (typeof x == "string") {
            this.setId(x);
        }
    }
    // **********************************************************getter || setter**********************************************************
    // ************************名称************************
    getNoteName(): string {
        if (!this.noteName) throw `Note:未设置noteName`;
        return this.noteName;
    }
    setNoteName(noteName: string): Note {
        this.noteName = noteName;
        // 同步更数据库
        if (db.exist(this.getId())) db.update(this.getId(), { noteName });
        // 返回对象，用于链式操作
        return this;
    }
    // ************************笔记Id************************
    getId(): string | number {
        if (!this.id) throw `Note:未设置id`;
        return this.id;
    }
    setId(id: string | number): Note {
        if (!this.id && db.exist(id)) {
            // 笔记没有设置id的时候，初始化数据
            this.id = id;
            let {
                noteName,
                target,
                level,
                startDate,
                latestDate,
                history
            } = db.get(id);
            this.setNoteName(noteName)
                .setTarget(target)
                .setLevel(level)
                .setStartDate(startDate)
                .setLatestDate(latestDate)
                .setHistory(history);
        } else if (!this.id) {
            // 如果数据库中不存在的话，初始化数据
            this.id = id;
        } else {
            throw `Note.setId:不能将id "${this.id}" 设置为 "${id}"`;
        }
        // 返回对象，用于链式操作
        return this;
    }
    // ************************笔记空间************************
    getNoteSpace(): string {
        // *******错误排查*******
        if (!this.noteSpace) throw `Note:未设置noteSpace`;
        return this.noteSpace;
    }
    setNoteSpace(noteSpace: string): Note {
        if (!fs.existsSync(noteSpace)) throw `Note.setNoteSpace:笔记空间路径 "${noteSpace}" 不存在`;
        this.noteSpace = noteSpace.replace(/\\/g, "/");
        // 返回对象，用于链式操作
        return this;
    }
    // ************************复习空间************************
    getReviewSpace(): string {
        // *******错误排查*******
        if (!this.reviewSpace) throw `Note:未设置reviewSpace`;
        return this.reviewSpace;
    }
    setReviewSpace(reviewSpace: string): Note {
        // *******错误排查*******
        if (!fs.existsSync(reviewSpace)) fs.mkdirSync(reviewSpace);
        this.reviewSpace = reviewSpace.replace(/\\/g, "/");
        // 返回对象，用于链式操作
        return this;
    }
    // ************************源文件完整路径************************
    getFilePath(): string {
        // *******错误排查*******
        if (!this.filePath) throw `Note:未设置filePath`;
        return this.filePath;
    }
    setFilePath(path: string): Note {
        path = path.replace(/\\/g, "/");
        // *******错误排查*******
        let { name, directory, filePath, extension } = getPathInfo(path);
        // 笔记是否属于笔记空间
        if (path.indexOf(this.getNoteSpace()) != 0) throw `Note.setFilePath:文件 "${name + extension}" 不在 笔记空间 "${this.getNoteSpace()}" 中`;
        // 笔记是否存在
        // if (!fs.existsSync(filePath)) throw `Note.setFilePath:文件 "${name + extension}" 不存在`;
        // 初始化数据
        this.setFileName(name + extension)
            .setDirectory(directory)
            .setExtension(extension);
        this.filePath = filePath;
        // 返回对象，用于链式操作
        return this;
    }
    // ************************设置文件名字************************
    getFileName(): string {
        if (!this.fileName) throw `Note:未设置fileName`;
        return this.fileName;
    }
    private setFileName(fileName: string): Note {
        this.fileName = fileName;
        // 返回对象，用于链式操作
        return this;
    }
    // ************************获取文件所在目录************************
    getDirectory(): string {
        if (!this.directory) throw `Note:未设置directory`;
        return this.directory;
    }
    setDirectory(directory: string): Note {
        this.directory = directory;
        // 返回对象，用于链式操作
        return this;
    }
    // ************************文件类型************************
    getExtension(): string {
        if (!this.extension) throw `Note:未设置extension`;
        return this.extension;
    }
    private setExtension(extension: string): Note {
        this.extension = extension;
        // 返回对象，用于链式操作
        return this;
    }
    // ************************艾宾浩斯周期目标************************
    getTarget(): number { return this.target; }
    setTarget(target: number): Note {
        this.target = target;
        // 同步更数据库
        if (db.exist(this.getId())) db.update(this.getId(), { target });
        // 返回对象，用于链式操作
        return this;
    }
    // ************************艾宾浩斯已学习周期************************
    getLevel(): number { return this.level; }
    setLevel(level: number): Note {
        this.level = level;
        // 同步更数据库
        if (db.exist(this.getId())) db.update(this.getId(), { level });
        // 返回对象，用于链式操作
        return this;
    }
    // ************************获取开始日期************************
    getStartDate(): string { return this.startDate; }
    setStartDate(startDate: string): Note {
        this.startDate = startDate;
        // 同步更数据库
        if (db.exist(this.getId())) db.update(this.getId(), { startDate });
        // 返回对象，用于链式操作
        return this;
    }
    // ************************最近复习日期************************
    getLatestDate(): string { return this.latestDate; }
    setLatestDate(latestDate: string): Note {
        this.latestDate = latestDate;
        // 同步更数据库
        if (db.exist(this.getId())) db.update(this.getId(), { latestDate });
        // 返回对象，用于链式操作
        return this;
    }
    // ************************下次学习时间************************
    getReviewDate(): string { return getDay(this.getReviewInterval(), this.getLatestDate()); }
    // ************************两个周期之间的间隔天数************************
    getReviewInterval(): number {
        let cycle: number = this.getLevel() <= this.getTarget() ? this.getLevel() : this.getTarget();
        let daysRemaining: number = Math.pow(2, cycle) - 1;
        return daysRemaining;
    }
    // ************************现在到下个周期的天数************************
    getRestOfDay() {
        let day: number = getDaysBetween(this.getLatestDate(), getDay(0));
        return Math.abs(day);
    }
    //************************周期到现在************************
    //************************获取拖延天数************************
    getDelayDays(date?:string): number {
        let day: number = Math.round(getDaysBetween(this.getReviewDate(), date?date:getDay(0)));
        return day < 0 ? 0 : day;
    }
    // ************************学习记录************************
    getHistory(): any
    getHistory(date: string): any
    getHistory(x?: string): any {
        if (typeof x == "string") {
            return this.history[x];
        } else {
            return this.history;
        }
    }
    setHistory(history: Object): Note
    setHistory(date: string, value: Object): Note
    setHistory(x: string | Object, y?: Object): Note {
        if (typeof x == "string" && typeof y == "object") {
            this.history[x] = y;
            // 同步更数据库
            if (db.exist(this.getId())) db.update(this.getId(), {
                history: this.history
            });
        } else {
            this.history = x;
            // 同步更数据库
            if (db.exist(this.getId())) db.update(this.getId(), {
                history: x
            });
        }
        // 返回对象，用于链式操作
        return this;
    }

    // **********************************************************方法**********************************************************
    // ************************是否可以学习************************
    canReview() {
        let nextDate: Date = new Date(this.getReviewDate());
        let nowDate: Date = new Date(getDay(0));
        return nextDate <= nowDate;
    }
    // ************************进行下一轮复习************************
    levelUp(): Note
    levelUp(date: string): Note
    levelUp(callback: Function): Note
    levelUp(x?: string | Function): Note {
        // 如果可以复习，则可以进入下一轮
        if (!this.canReview()) return this;
        let date: string = x && typeof x == "string" ? x : getDay(0);
        // 在setLatestDate设置上一次复习日期之前，储存 拖延日期，出错
        let tempDelay:number = this.getDelayDays(date);
        this// 添加复习记录 X 更新复习时间
            .setLatestDate(date)
            // 更新历史
            .setHistory(date, {
                delayDays: tempDelay,
                level: this.getLevel()
            })
            // 学习周期推进
            .setLevel(this.getLevel() > this.getTarget() ? this.getTarget() : this.getLevel() + 1);
        // 更新数据库
        if (db.exist(this.getId())) db.update(this.getId(), {
            level: this.getLevel(),
            latestDate: this.getLatestDate()
        });
        // 更改最新的文件名字
        let newFileName: string = `${this.getDirectory()}/#${this.getId()}_${this.getNoteName() + this.getExtension()}`;
        fs.renameSync(this.getFilePath(), newFileName);
        // 高亮提示
        console.log('\x1B[32m%s\x1B[0m:', "复习完成", Note.getShortPath(this.getFilePath()));
        // 回调函数
        if (typeof x == "function") x(this);
        // 返回对象，用于链式操作
        return this;
    };
    // ************************判断链接是否存在************************
    existLink(): boolean {
        // *******错误排查*******
        return fs.existsSync(this.getLinkPath());
    }
    // ************************判断源文件是否存在************************
    existFile() {
        return fs.existsSync(this.getFilePath());
    }
    // ************************获取链接完整路径************************
    getLinkPath(): string {
        // 获取拖延时间
        // 如果拖延就分配到拖延目录
        // 链接路径
        if (this.getDelayDays() == 0) {
            let linkPath: string = `${this.getReviewSpace()}${this.getFilePath().replace(this.getNoteSpace(), "")}`;
            return linkPath;
        } else {
            let linkPath: string = `${this.getReviewSpace()}/！拖延${this.getDelayDays()}天的笔记${this.getFilePath().replace(this.getNoteSpace(), "")}`;
            return linkPath;
        }
    }
    // ************************获取链接目录************************
    getLinkDir(): string {
        // 获取拖延时间
        // 如果拖延就分配到拖延目录
        // 链接路径
        if (this.getDelayDays() == 0) {
            let linkDir: string = `${this.getReviewSpace()}${this.getDirectory().replace(this.getNoteSpace(), "")}`;
            return linkDir;
        } else {
            let linkDir: string = `${this.getReviewSpace()}/！拖延${this.getDelayDays()}天的笔记${this.getDirectory().replace(this.getNoteSpace(), "")}`;
            return linkDir;
        }
    }
    // ************************创建学习链接************************
    createLink(): Note {
        // 如果不存在链接，就创建
        if (this.existLink()) return this;
        // 创建深度文件夹
        createDeepDir(this.getLinkDir(), this.getReviewSpace());
        // 判断是否为*****************************************************链接
        // fs.statSync(this.filePath).isSymbolicLink
        // 尝试创建硬链接
        try {
            fs.linkSync(this.getFilePath(), this.getLinkPath());
            // 尝试创建软链接
        } catch (err) {
            // 复制最好用异步，避免文件大，速度慢
            fs.copyFileSync(this.getFilePath(), this.getLinkPath());
            // 软链接
            // fs.symlinkSync(this.getFilePath(), this.getLinkPath());
        }
        console.log('\x1B[33m%s\x1b[0m:', "新增复习", Note.getShortPath(this.getFilePath()));
        // 返回对象，用于链式操作
        return this;
    };
    // ************************判断是否存在数据************************
    existData(): boolean {
        return db.exist(this.getId());
    }
    // ************************删除数据************************
    removeData(): Note {
        if (!db.exist(this.getId())) return this;
        db.remove(this.getId());
        console.log('\x1B[41m%s\x1B[0m:', "删除数据", Note.getShortPath(this.getFilePath()));
        return this;
    }
    // ************************初始化文件************************
    // 新添加笔记的笔记，需要调用这个初始化文件名
    init(): Note {
        // 新建并笔记，初始化数据
        db.set(this.getId(), {
            noteName: this.getNoteName(),
            target: this.getTarget(),
            level: this.getLevel(),
            startDate: this.getStartDate(),
            latestDate: this.getLatestDate(),
            history: this.getHistory(),
        });
        this.fileNameFmt();
        console.log('\x1B[36m%s\x1B[0m:', "新增笔记", Note.getShortPath(this.getFilePath()));
        return this;
    }
    // ************************获取格式化的名字************************
    getFileNameFmt() {
        //生成新的统一格式名称
        let newFileName: string = `#${this.getId()}_${this.getNoteName() + this.getExtension()}`;
        let newFilePath: string = `${this.getDirectory()}/${newFileName}`;
        return newFilePath;
    }
    // ************************文件重名************************
    fileNameFmt(): Note {

        //源文件重名
        fs.renameSync(this.getFilePath(), this.getFileNameFmt());
        //重新设置源文件路径
        this.setFilePath(this.getFileNameFmt());
        return this;
    }
    // 获取笔记名称特征
    static getNamePattern(fileName: string): any {
        // 筛选符合规则的文件
        let reg = new RegExp("^(#|@|-{1,2}|-\\+|\\+-|[0-9]{4}[,\\.\\-，：][0-9]{1,2}[,\\.\\-，：][0-9]{1,2}@)([0-9a-z_]{5})_(.*)(\\.[^.]+)$|^(\\+\\+|~@{0,1}|@~{0,1}|@)(.*)(\\.[^.]+)$");
        let result: any = reg.exec(fileName);
        // 文件名不符合规则，就返回
        if (!result) return null;
        // 获取文件操作符                   (#)笔记Id^周期_笔记名字.txt
        let operator: string = result[1] ? result[1] : result[5];
        // 获取操作符上的日期               (2020-2-23)@笔记Id^周期_笔记名字.txt
        reg = new RegExp("([0-9]{4}[,\\.\\-，：][0-9]{1,2}[,\\.\\-，：][0-9]{1,2})@");
        let dateResult: any = reg.exec(operator);
        let date: string = dateResult && dateResult[1] ? dateResult[1] : null;
        // 获取笔记id                       #(笔记Id)^周期_笔记名字.txt
        let id: string = result[2] ? result[2] : null;
        // 获取笔记等级                     #笔记Id^(周期)_笔记名字.txt
        // let level: number = result[3] ? result[3] : null;
        // 获取笔记名字，非文件名字         #笔记Id^周期_(笔记名字).txt
        let name: string = result[3] ? result[3] : result[6];
        // 获取文件后缀                 .txt|.mp3
        let extension: string = result[4] ? result[4] : result[7];
        return { operator, date, name, id, extension };
    }
    // 获取笔记空间下的子路径，非完整路径
    static getShortPath(path: string): string {
        let reg = new RegExp(`^${strings.reviewSpace}(/！拖延\\d+天的笔记)*|^${strings.noteSpace}`);
        // 子路径               笔记空间(/新概念一/第一课.mp3)
        let shortPath: string = path.replace(reg, "");
        return shortPath;
    }
    // url文件提取
    static urlFileParser(path: string): any {
        // 读取文件内容
        let string: string = fs.readFileSync(path).toString();
        // 匹配链接
        let reg: RegExp = new RegExp("URL=(https{0,1}://\\S+)\\s+$");
        let result: any = reg.exec(string);
        // 如果匹配的到，则返回链接
        if (result) return result[1]; else return null;
    }
    // 文件批量转html
    static urlBatchParser(path: string): Array<any> | null {
        // 读取文件内容
        let value: string = fs.readFileSync(path).toString().trim();
        let reg: RegExp = new RegExp("[\r\n]+");
        // 在空格换行处切割字符
        let values: Array<string> = value.split(reg);
        let result: Array<any> = new Array();
        // 如果长度为奇数，报错
        if (values.length % 2 != 0) throw `转换网址失败\n地址：${path}`;
        for (let i = 0, len = values.length; i < len; i = i + 2) {
            let x: string = values[i].trim();
            let y: string = values[i + 1].trim().replace(/\s+/g, " ");
            // 如果x以http(s)://开头
            if (/^https{0,1}:\/\/.*/.test(x)) {
                // 替换文件名的非法字符
                y = y.replace(/\?/g, "？");
                y = y.replace(/\|/g, "or");
                y = y.replace(/\</g, "《");
                y = y.replace(/\>/g, "》");
                y = y.replace(/\//g, ".");
                y = y.replace(/\\/g, ".");
                y = y.replace(/\:/g, "：");
                y = y.replace(/\"/g, "'");
                y = y.replace(/\*/g, "x");
                result.push({
                    url: x,
                    title: y.replace(/\s+/g, " ")
                });
                // 如果y以http(s)://开头
            } else if (/^https{0,1}:\/\/.*/.test(y)) {
                // 替换文件名的非法字符
                x = x.replace(/\?/g, "？");
                x = x.replace(/\|/g, "or");
                x = x.replace(/\</g, "《");
                x = x.replace(/\>/g, "》");
                x = x.replace(/\//g, ".");
                x = x.replace(/\\/g, ".");
                x = x.replace(/\:/g, "：");
                x = x.replace(/\"/g, "'");
                x = x.replace(/\*/g, "x");
                result.push({
                    url: y,
                    title: x.replace(/\s+/g, " ")
                });
            }
        }
        // 如果长度为0返回null
        if (result.length != 0) return result; else return null;
    }
    // 根据 地址 和 名称 创建一个html网页
    static createHtmlFile(path: string, url: string) {
        // let { name, directory, filePath, extension } = getPathInfo(path);
        //html模板处理
        let html: string = `<html><head><script>window.location.href="${url}";</script></head><body><h3>请使用最新浏览器打开</h3></body></html>`;
        // 创建文件 并 写入内容
        fs.writeFileSync(path, html);
    }
}


