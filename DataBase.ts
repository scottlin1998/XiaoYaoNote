import fs from "fs";
import { getCharBetween } from "../others/utils";
import { SysConverter } from "./SysConverter";
class DataBase {
    // **********************************************************属性**********************************************************
    // 数据
    private data: any = {};
    // 保存地址
    private path: string | undefined;
    // 数据长度
    private length: number = 0;
    // 选中操作目标
    private target: string | undefined;
    // id使用情况集合
    private usedIds: Array<number> = new Array();
    // 32进制映射表
    private chars: Array<string> = new Array().concat(getCharBetween(48, 57), getCharBetween(97, 118));
    // 进制转换
    private sysc: SysConverter = new SysConverter(this.chars.length, this.chars);;
    // **********************************************************构造函数**********************************************************
    constructor(data: Object)
    constructor(path: string)
    constructor(path: string, data: Object)
    constructor(x: string | Object, y?: Object) {
        if (typeof x == "string") {
            this.setPath(x);
            // 判断目标文件是否存在，不存在就创建
            if (!fs.existsSync(this.getPath())) { fs.writeFileSync(this.getPath(), JSON.stringify({})); }
            // 如果用户传入数据则覆盖，则不读取文件中的数据
            let data: any = y && typeof y == "object" ? y : JSON.parse(
                fs.readFileSync(this.getPath())
                    .toString()
            );
            this.data = data;
            // 读取传入数据的所有已使用的id
            let ids: Array<string> = Object.keys(data);
            this.length = ids.length;
            // 遍历data中的所有id，添加到id使用情况集合中
            ids.forEach(item => {
                // 记录已使用的id
                this.setUsedId(item);
            });
            // 当传入的数Object时
        } else if (typeof x == "object") {
            let data: any = x;
            this.data = data;
            // 读取传入数据的所有已使用的id
            let ids: Array<string> = Object.keys(data);
            this.length = ids.length;
            // 遍历data中的所有id，添加到id使用情况集合中
            ids.forEach(item => {
                // 记录已使用的id
                this.setUsedId(item);
            });
        }
    }
    // **********************************************************getter || setter**********************************************************
    // 目标
    private getTarget(): string {
        if (!this.target) throw `DataBase:未设置target`;
        return this.target;
    }
    private setTarget(): DataBase
    private setTarget(target: string | number): DataBase
    private setTarget(x?: string | number): DataBase {
        // 判断传入的目标是否合法
        if (typeof x == "string") {
            this.target = x;
        } else if (typeof x == "number") {
            this.target = this.sysc.convert(x, 5);
        } else {
            this.target = undefined;
        }
        return this;
    }
    // 长度
    private increaseLen(): DataBase {
        this.length++;
        return this;
    }
    private decreaseLen(): DataBase {
        this.length--;
        return this;
    }
    // 保存路径
    getPath(): string {
        if (!this.path) throw `DataBase:未设置path`;
        return this.path;
    }
    setPath(path: string): DataBase {
        this.path = path;
        return this;
    }
    // ************************提供Id************************
    // 补空位
    getNextId(): string {
        // 获取下一个十进制的Id
        let nextDecId: number = this.usedIds.indexOf(0);
        // 如果id使用情况集合里面还有没有使用的id，拿出来使用
        if (this.usedIds.length != 0 && nextDecId != -1) {
            // 拿到下一个数据的id
            let nextId: string | undefined = this.sysc.convert(nextDecId, 5);
            // 将id返回给客户端使用
            return nextId;
            // 如果id使用情况集合里面没有使用的id，则放回新的未使用id
        } else {
            // 根据数据库长度计算下一个数据的id
            return this.sysc.convert(this.usedIds.length, 5);
        }
    }
    getUsedId(): Array<number> { return this.usedIds; }
    private setUsedId(target: string) {
        // 32进制转十进制，id转数字
        let decId: number = this.sysc.toDecimal(target);
        let usedIdsLen: number = this.usedIds.length;
        // 获取目标id超出id使用集合的个数
        let newUnusedIdsLen: number = decId - usedIdsLen;
        // 如果目标超过已使用id集合的长度，补回中间未使用的id的数目
        if (newUnusedIdsLen > 0) {
            // 创建空白的Array先fill完再和其他Array合并，速度有显著提升
            let tempArray: Array<number> = new Array(newUnusedIdsLen);
            // 填充所有数据为0，未使用
            tempArray.fill(0, 0, tempArray.length);
            // 设置目标id处未1，已使用
            tempArray[tempArray.length] = 1;
            // 同样的长度，如果Array中有其他值，会影响到fill的速度
            this.usedIds = this.usedIds.concat(tempArray);
            // 只有当data里面没有相应的数据时，才会增加长度
            if (!this.data[target]) this.increaseLen();
        } else {
            // 设置目标id处未1，已使用
            this.usedIds[decId] = 1;
            // 只有当data里面没有相应的数据时，才会增加长度
            if (!this.data[target]) this.increaseLen();
        }
        return this;
    }
    private setUnUsedId(target: string): DataBase {
        this.decreaseLen();
        // 设置目标id处未0，未使用
        this.usedIds[this.sysc.toDecimal(target)] = 0;
        return this;
    }
    // **********************************************************方法**********************************************************
    // ************************选中目标************************
    id(id: string | number): DataBase {
        this.setTarget(id);
        return this;
    }
    // ************************添加数据************************
    add(data: Object): DataBase {
        // 获取下一个未使用的Id，并设置未目标
        this.setTarget(this.getNextId());
        // 新添加数据到未使用的Id
        this.data[this.getTarget()] = data;
        // 标记刚刚使用的已使用的id
        this.setUsedId(this.getTarget())
            // 增加长度
            .increaseLen()
            // 清空目标
            .setTarget();
        return this;
    }
    // ************************重置数据************************
    set(data: Object): DataBase
    set(id: string | number, data: Object): DataBase
    set(x: string | number, y?: Object): DataBase {
        // 如果用户同时传入目标
        if ((typeof x == "string" || typeof x == "number") && typeof y == "object") {
            this.setTarget(x);
        }
        let data: any = y ? y : x;
        this.setUsedId(this.getTarget());
        this.data[this.getTarget()] = data;
        // 清空选中目标
        this.setTarget();
        return this;
    }
    // ************************删除数据************************
    remove(): DataBase
    remove(id: string | number): DataBase
    remove(x?: string | number): DataBase {
        // 如果用户同时传入目标
        if (typeof x == "string" || typeof x == "number") {
            this.setTarget(x);
        }
        // 存在才会删除
        if (this.data[this.getTarget()]) {
            delete this.data[this.getTarget()];
            this.setUnUsedId(this.getTarget());
        } else {
            throw `DataBase.remove:无法删除不存在的元素 ${x}`;
        }
        // 清空选中目标
        this.setTarget();
        return this;
    }
    // ************************修改Note************************
    update(data: Object): DataBase
    update(id: string | number, data: Object): DataBase
    update(x: string | number | Object, y?: Object): DataBase {
        // 如果用户同时传入目标
        if ((typeof x == "string" || typeof x == "number") && typeof y == "object") {
            this.setTarget(x);
        }
        // 初始化变量
        let data: any = y ? y : x;
        if (this.data[this.getTarget()]) {
            for (const key in data) {
                this.data[this.getTarget()][key] = data[key];
            }
        } else {
            throw `DataBase.update:无法更新不存在的元素 "${x}"`;
        }
        // 清空选中目标
        this.setTarget();
        return this;
    }
    // ************************读取数据************************
    get(): any
    get(id: string | number): any
    get(x?: string | number): any {
        let result: any;// 返回结果
        // 如果用户同时传入目标
        if (typeof x == "string" || typeof x == "number") {
            // 初始化变量
            this.setTarget(x);
            result = this.data[this.getTarget()];
        } else {
            result = this.data;
        }
        // 清空选中目标
        this.setTarget();
        return result;
    }
    // ************************获取长度************************
    count(): number {
        // 清空选中目标
        this.setTarget();
        return this.length;
    }
    // ************************是否存在************************
    exist(id?: string | number): boolean {
        // 设置目标
        if (typeof id == "string" || typeof id == "number") this.setTarget(id);
        let result: boolean = !!this.data[this.getTarget()];
        // 清空选中目标
        this.setTarget();
        return result;
    }
    // ************************保存数据************************
    save(path?: string): DataBase {
        // 设置路径
        if (path) this.setPath(path);
        fs.writeFileSync(this.getPath(), JSON.stringify(this.data));
        // 清空目标
        this.setTarget();
        return this;
    }
}

export default DataBase;



