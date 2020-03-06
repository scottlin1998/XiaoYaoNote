import Note from "./classes/Note";
import strings from "./others/strings";
import db from "./others/db";

//初始化笔记 和 创建笔记
let note: Note = new Note();
note //设置笔记储存空间
    .setNoteSpace(strings.noteSpace)
    //设置笔记复习空间
    .setReviewSpace(strings.reviewSpace)
    .setFilePath("C:\\Users\\Scott Lin\\Desktop\\我的项目\\XiaoYaoNote V3.5 2020年2月24日\\2.我的笔记\\新建 DOC 文档.doc")
    // 设置笔记id，如果没有id，从数据库中分配一个
    .setId(10000)
    // 设置笔记名字
    .setNoteName("sdddd")
    .init()
    console.log(db.get());
