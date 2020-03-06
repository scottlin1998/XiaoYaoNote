// ******************************************今日复习******************************************
// 操作                             功能                            实现
// #笔记Id^周期_                     显示复习笔记                       是
// @笔记Id^周期_                     完成复习                           是
// @文件名                          添加并复习笔记                      是
// !笔记ID^周期_                     超出日期1天                        弃用
// !!笔记Id^周期_                    超出日期2天                        弃用
// !!!笔记Id^周期_                   超出日期3天                        弃用
// !拖延N天的笔记                       文件夹                          是
// 2019-10-11@笔记Id^周期_           笔记指定日期完成复习                 是
// 正则表达式                                                           是
// ^(#|@|[0-9]{4}[,\\.\\-，：][0-9]{1,2}[,\\.\\-，：][0-9]{1,2}@)([0-9a-z_]{5})\\^(\\d{1,2})_(.*)(\\.[^.]+)$|^(@)(.*)(\\.[^.]+)$

// ******************************************我的笔记******************************************
// 操作                             功能                            实现
// #笔记Id^周期_                     显示笔记                          是
// @笔记Id^周期_                     周期设置                          否
// @文件名                          添加并复习笔记                      是
// @+ | +@                          添加并复习                          是
// $笔记Id^周期_                     笔记所有复习已经完成                否
// ++文件名                         添加笔记                            是
// --文件名                         删除笔记和笔记数据                   是
// -文件名                          删除笔记数据                        是
// +-笔记Id^周期_                   重置笔记数据                        否
// +-笔记Id^周期_                   重置笔记数据                        否
// ~文件名                          批量网址添加                        否
// 自动回收数据                                                        弃用
// 正则表达式                                                          是
// ^(#|@|-{1,2}|-\\+|\\+-)([0-9a-z_]{5})\\^(\\d{1,2})_(.*)(\\.[^.]+)$|^(\\+\\+|~|@)(.*)(\\.[^.]+)$

// ******************************************其他功能******************************************
// 操作                             功能                            实现
// .bat                             bat扫描删除没有的数据               否
// .bat                             node接收bat传参                     否
// 文件夹                           回收箱                              是
// 回收操作失误的文件                   所有操作失误                        否
// (命令)文件名                      弹性操作                              否
// (命令)笔记Id_                     弹性指令                               否
// 命令行版不需要显示周期                                                   否

import { dirRecursion, getDaysBetween, getDay, createDirs, toTrashBin, createDeepDir } from "./others/utils";
import Note from "./classes/Note";
import fs from "fs";
import strings from "./others/strings";
import db from "./others/db";
// 捕获程序错误
try {
    // 初始化笔记空间、复习空间、回收箱
    createDirs(strings.noteSpace, strings.reviewSpace, strings.trashBin);
    // ************************************************遍历今日复习************************************************
    dirRecursion(strings.reviewSpace, function (data: any) {
        // 获取文件基本信息
        let { fileName, filePath, directory, type } = data;
        // 获取文件名特征
        let patterns: any = Note.getNamePattern(fileName);
        // 如果找不到文件特征，则跳过
        if (!patterns) return;
        // 操作符、时间、笔记名字、笔记id、笔记周期、文件后缀
        let { operator, date, name, id, extension } = patterns;
        // 获取笔记空间下的子路径，非完整路径
        // 子路径               笔记空间(/新概念一/第一课.mp3)
        // let shortPath: string = Note.getShortPath(filePath);
        // 子目录               笔记空间(/新概念一/第一课)
        let shortDir: string = Note.getShortPath(directory);
        // 笔记源文件夹，笔记源文件地址
        let noteDir: string = strings.noteSpace + shortDir;
        let notePath: string = id ? `${noteDir}/#${id}_${name + extension}` : `${noteDir}/${fileName}`;
        //初始化笔记 和 创建笔记
        let note: Note = new Note();
        note //设置笔记储存空间
            .setNoteSpace(strings.noteSpace)
            //设置笔记复习空间
            .setReviewSpace(strings.reviewSpace)
            // 设置笔记源文件路径
            .setFilePath(notePath)
            // 设置笔记id，如果没有id，从数据库中分配一个
            .setId(id ? id : db.getNextId())
            // 设置笔记名字
            .setNoteName(name);
        // 对不同的操作符进行相应的处理
        switch (operator) {
            // ******************显示复习笔记******************
            case "#":
                // 如果 不存在笔记数据、不能存在笔记源文件、旧的复习笔记链接 不等于 新的复习笔记链接、笔记不可以复习 其中一个成立，则删除
                if (!note.existData() || !note.existFile() || note.getLinkPath() != filePath || !note.canReview()) toTrashBin(filePath);
                break;
            // ******************完成复习******************
            case "@":
                // 如果 笔记名称有id 和 （不存在笔记数据、不能存在笔记源文件、笔记不可以复习 其中一个成立），则删除
                if (id && (!note.existData() || !note.existFile() || !note.canReview())) toTrashBin(filePath);
                else if (id) {
                    // 笔记进入下一轮复习
                    note.levelUp();
                    // 删除掉 同个id，不同等级 或 不同名 的链接
                    toTrashBin(filePath);
                } else if (!id) {
                    // 笔记移动到 笔记库, 让下一个目录遍历来处理
                    createDeepDir(shortDir, strings.noteSpace);
                    fs.renameSync(filePath, notePath);
                }
                break;
            // ******************批量网址添加******************
            case "@~":
            case "~@":
            case "~":
            case "++":
                // 笔记移动到 笔记库, 让下一个目录遍历来处理
                createDeepDir(shortDir, strings.noteSpace);
                fs.renameSync(filePath, notePath);
                break;
            // 其他保留操作
            case "-":
            case "--":
            case "+-":
            case "-+":
                toTrashBin(filePath);
                break;
            // ******************笔记指定日期完成复习******************
            default:
                // 如果 不存在笔记数据、不能存在笔记源文件、笔记不可以复习、指定复习日期不超过今天 其中一个成立，则删除
                if (!note.existData() || !note.existFile() || !note.canReview() || getDaysBetween(getDay(0), date) > 0) toTrashBin(filePath);
                else {
                    // 拖延显示问题####################################
                    note.levelUp(date);
                    // 删除掉改名后的笔记链接
                    toTrashBin(filePath);
                }
                break;
        }
    }, true);

    // ************************************************遍历我的笔记************************************************
    dirRecursion(strings.noteSpace, function (data: any) {
        // 获取文件基本信息
        let { fileName, filePath, directory, type } = data;
        // 跳过文件夹
        if (type == "dir") return;
        // 获取文件名特征
        let patterns: any = Note.getNamePattern(fileName);
        // 如果找不到文件特征，则跳过
        if (!patterns) return;
        // 操作符、时间、笔记名字、笔记id、笔记周期、文件后缀
        let { operator, date, name, id, extension } = patterns;
        //初始化笔记 和 创建笔记
        let note: Note = new Note();
        note //设置笔记储存空间
            .setNoteSpace(strings.noteSpace)
            //设置笔记复习空间
            .setReviewSpace(strings.reviewSpace)
            // 设置笔记源文件路径
            .setFilePath(filePath)
            // 设置笔记id，如果没有id，从数据库中分配一个
            .setId(id ? id : db.getNextId())
            // 设置笔记名字
            .setNoteName(name);
        // 对不同的操作符进行相应的处理
        switch (operator) {
            // ******************显示笔记******************
            case "#":
                // 如果 笔记存在数据 且 可以复习 且 还没存在复习链接，则创建链接
                if (note.existData() && note.canReview() && !note.existLink()) note.createLink();
                break;
            // ******************删除源文件和数据******************
            case "--":
                // 删除数据
                note.removeData();
                toTrashBin(filePath);
                break;
            // ******************删除笔记数据******************
            case "-":
                // 删除数据
                note.removeData()
                    // 文件名格式化
                    .fileNameFmt();
                break;
            // ******************重置笔记数据******************保留
            case "-+":
            case "+-":
                toTrashBin(filePath);
                break;
            // ******************添加并复习笔记******************
            case "@":
            // ******************添加笔记******************
            case "++":
                // 如果是 url ，则先转换为 html
                if (extension == ".url") {
                    // html文件路径
                    let htmlPath: string = `${directory}/${name}.html`;
                    let url = Note.urlFileParser(filePath);
                    // 如果在 url 文件中找不链接，则放入回收箱，并退出
                    toTrashBin(filePath);
                    // url 文件中找不到链接，就退出
                    if (!url) break;
                    // 创建html文件
                    Note.createHtmlFile(htmlPath, url);
                    // 设置新的 html 文件路径
                    note.setFilePath(htmlPath);
                    // 其他文件的时候，直接设置
                }
                // 初始化笔记
                note.init();
                // 笔记进入下一轮复习
                if (operator == "@") note.levelUp(); else note.createLink();
                break;
            // ******************批量网址添加******************
            case "@~":
            case "~@":
            case "~":
                let result: Array<any> | null = Note.urlBatchParser(filePath);
                // 如果 txt 文档中没有链接，直接退出
                toTrashBin(filePath);
                if (!result) break;
                // 循环一个一个的添加链接
                result.forEach(data => {
                    let { url, title } = data;
                    // html文件路径
                    let htmlPath: string = `${directory}/${title}.html`;
                    // 创建一个Html文件
                    Note.createHtmlFile(htmlPath, url);
                    // 自动将html添加复习
                    note = new Note();
                    note // 设置笔记储存空间
                        .setNoteSpace(strings.noteSpace)
                        // 设置笔记复习空间
                        .setReviewSpace(strings.reviewSpace)
                        // 设置笔记id
                        .setId(db.getNextId())
                        // 设置笔记源文件路径
                        .setFilePath(htmlPath)
                        // 设置笔记名字
                        .setNoteName(title)
                        // 初始化笔记
                        .init();
                    // 创建html笔记 并 进入下一轮复习
                    if (operator.includes("@")) note.levelUp(); else note.createLink();
                });
                break;
        }
    });
    // 保存笔记数据
    db.save();
    // 输出错误到控制台
} catch (err) {
    console.log('\x1B[41m%s\x1B[0m:', "程序出错", err);
} finally {
    console.log("\n按任意键退出。。。");
    // 保留窗口,并接收键盘输入
    process.stdin.on("data", function () {
        // 退出程序
        process.exit();
    });
}
