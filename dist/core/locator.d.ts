export type LocatorType = "css" | "xpath";
export interface ParsedLocator {
    type: LocatorType;
    value: string;
    raw: string;
}
/**
 * 解析 Drission 风格的定位字符串（完全对齐 DrissionPage 的 locator.py）
 *
 * 支持的格式：
 * - css 相关："css:div" / "css=.btn" / "c:div" / "c=.btn"
 * - xpath 相关："xpath://div" / "x://div"
 * - 文本相关："text=精确" / "text:包含" / "text^前缀" / "text$后缀"
 * - 标签相关："tag:div" / "t:div" / "tag:div@class=foo" / "tag:div@@class=foo@id=bar"
 * - 属性相关：
 *   - "@attr=value" / "@attr:value" / "@attr^value" / "@attr$value" / "@attr" - 单属性
 *   - "@@attr1=val1@attr2=val2" - 多属性 AND（支持 = : ^ $ 操作符）
 *   - "@|attr1=val1@attr2=val2" - 多属性 OR（支持 = : ^ $ 操作符）
 *   - "@!attr" / "@!attr=val" - 属性否定
 * - 简写：".class" / "#id" / ".=class" / ".:class" / ".^class" / ".$class"
 * - 默认：纯文本 → 模糊文本搜索（与 DrissionPage 一致）
 */
export declare function parseLocator(loc: string): ParsedLocator;
/**
 * 将 " 转义为 XPath concat 形式（对齐 Python _quotes_escape）
 */
declare function _quotesEscape(searchStr: string): string;
export { _quotesEscape as quoteXPath };
