import { PageScroller } from "./PageScroller";
/**
 * 页面滚动设置类
 * 对应 DrissionPage.PageScrollSetter
 */
export declare class PageScrollSetter {
    private readonly _scroll;
    constructor(scroll: PageScroller);
    /**
     * 设置滚动命令后是否等待完成
     */
    wait_complete(onOff?: boolean): void;
    /**
     * 设置页面滚动是否平滑滚动
     */
    smooth(onOff?: boolean): void;
}
