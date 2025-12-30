export type LocatorType = "css" | "xpath";
export interface ParsedLocator {
    type: LocatorType;
    value: string;
    raw: string;
}
/**
 * 解析 Drission 风格的定位字符串：
 * - css 相关："css:div" / "css=.btn" / "c:div" / "c=.btn" / ".class" / "#id"
 * - xpath 相关："xpath://div" / "x://div"
 * - 文本相关："text=精确" / "text:包含" / "text^前缀" / "text$后缀"
 * - 标签相关："tag:div" / "t:div"
 * - 属性相关：
 *   - "@attr=value" / "@attr" - 单属性
 *   - "@@attr1=val1@attr2=val2" - 多属性 AND
 *   - "@|attr1=val1@attr2=val2" - 多属性 OR
 *   - "@!attr" - 属性不存在
 */
export declare function parseLocator(loc: string): ParsedLocator;
