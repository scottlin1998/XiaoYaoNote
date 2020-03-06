import Note from "./Note";

class CommandHandle{
    // **********************************************************属性**********************************************************
    private command:Array<string> | undefined;
    private note:Note | undefined;
    // **********************************************************构造函数**********************************************************
    constructor(){

    }
    // **********************************************************getter || setter**********************************************************
    // 命令
    getCommand(){
        if(!this.command) throw `CommandHandle:未设置command`;
        return this.command;
    }
    setCommand(commands:string|Array<string>){
        // 传入文本命令
        if(typeof commands == "string"){
            this.command = commands.split(/(@|)/);
            // 传入数组命令
        }else if(typeof commands == "object"){
            this.command = commands;
        }
    }
    addCommand(command:string){
        this.command?.push(command);
    }
    // 设置笔记
    getNote(){}
    setNote(){}
    // addNote(){}
    // **********************************************************执行命令**********************************************************
    // 把所有要做的东西集中到这里，统一执行
    // 执行
    execute(){
        // while(){

        // }
    }
}