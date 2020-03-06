import DataBase from "../classes/DataBase";
import strings from "./strings";
// 给数据库设置储存路径
export default new DataBase(strings.noteDataPath);
