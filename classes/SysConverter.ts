export class SysConverter {
    // **********************************************************属性**********************************************************
    private stringArray: Array<string> | undefined;
    private system: number | undefined;
    private stringMap: any = {};
    private covering: number = 0;
    // 构造函数

    // **********************************************************构造函数**********************************************************
    constructor(system: number)
    constructor(stringArray: Array<string>)
    constructor(system: number, stringMap: Array<string>)
    constructor(x: number | Array<string>, y?: Array<string>) {
        if (typeof x == 'number') {
            this.setSystem(x);
        } else if (typeof x == "object") {
            this.setStringArray(x);
        }
        if (typeof y == "object") {
            this.setStringArray(y);
        }
    }
    // **********************************************************getter || setter**********************************************************
    // 进制
    getSystem() {
        if (!this.system) throw `SysConverter:未设置system`;
        return this.system;
    }
    setSystem(system: number): SysConverter {
        this.system = system;
        return this;
    }
    // 字符串映射表
    getStringArray(): Array<string> {
        if (!this.stringArray) throw `SysConverter:未设置stringArray`;
        return this.stringArray;
    }
    setStringArray(stringArray: Array<string>): SysConverter {
        this.stringArray = stringArray;
        // 反序列查询十进制
        for (let i = 0, len = stringArray.length; i < len; i++) {
            this.stringMap[stringArray[i]] = i;
        }
        return this;
    }
    // 字符串补位
    getCovering(): number {
        return this.covering;
    }
    setCovering(covering: number): SysConverter {
        this.covering = covering;
        return this;
    }
    // **********************************************************方法**********************************************************
    // 十进制转换其他进制
    convert(value: number, covering: number = 0): string {
        let data: Array<number> = SysConverter.convert(value, this.getSystem(), covering);
        let result: string = "";
        for (let i = 0; i < data.length; i++) {
            result += this.getStringArray()[data[i]];
        }
        return result;
    }
    // 其他进制转十进制
    toDecimal(value: string): number {
        let values: Array<string> = value.split("").reverse();
        let result: number = 0;
        for (let i = 0, len = values.length; i < len; i++) {
            // 反序列查询十进制
            let temp: number = this.stringMap[values[i]];
            result += Math.pow(this.getSystem(), i) * temp;
        }
        return result;
    }
    // **********************************************************静态**********************************************************
    // 转换数组
    static convert(value: number, system: number, covering: number = 0): Array<number> {
        // 绝对值
        value = Math.abs(value);
        // 结果
        let result: Array<number> = [];
        // 绝对循环
        while (true) {
            // 当商数小于进制数时
            if (value < system) {
                // 补上最后的余数
                result.push(Math.floor(value % system));
                break;
            } else {
                // 正常操作
                result.push(Math.floor(value % system));
                value = value / system;
            }
        }
        // 补位
        covering = covering - result.length;
        for (let i = 0; i < covering; i++) {
            result.push(0);
        }
        // 返回反序列
        return result.reverse();
    }
}
