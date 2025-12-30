import { ChromiumPage } from "./ChromiumPage";
import { Element } from "../core/Element";
export declare class ChromiumPageWaiter {
    private readonly _page;
    constructor(page: ChromiumPage);
    /**
     * 等待若干秒
     */
    wait(second: number, scope?: number): Promise<ChromiumPage>;
    ele(locator: string, timeoutMs?: number, intervalMs?: number): Promise<Element | null>;
    /**
     * 等待多个元素加载到 DOM
     */
    eles_loaded(locators: string | string[], timeout?: number, anyOne?: boolean): Promise<boolean>;
    /**
     * 等待 URL 变化（包含或不包含指定文本）
     */
    url_change(text?: string, exclude?: boolean, timeout?: number): Promise<ChromiumPage | false>;
    /**
     * 等待标题变化（包含或不包含指定文本）
     */
    title_change(text?: string, exclude?: boolean, timeout?: number): Promise<ChromiumPage | false>;
    /**
     * 等待页面开始加载
     */
    load_start(timeout?: number): Promise<boolean>;
    /**
     * 等待文档加载完成
     */
    doc_loaded(timeout?: number): Promise<boolean>;
    load(timeoutMs?: number): Promise<boolean>;
    /**
     * 等待新标签页出现
     */
    new_tab(timeout?: number): Promise<string | false>;
    ele_deleted(locator: string, timeout?: number): Promise<boolean>;
    ele_displayed(locator: string, timeout?: number): Promise<boolean>;
    ele_hidden(locator: string, timeout?: number): Promise<boolean>;
    /**
     * 等待上传文件路径输入完成
     */
    upload_paths_inputted(): Promise<boolean>;
    /**
     * 等待下载开始
     */
    download_begin(timeout?: number, cancelIt?: boolean): Promise<any | false>;
    /**
     * 等待所有下载任务完成
     */
    downloads_done(timeout?: number, cancelIfTimeout?: boolean): Promise<boolean>;
    /**
     * 等待所有浏览器下载任务结束（别名）
     */
    all_downloads_done(timeout?: number, cancelIfTimeout?: boolean): Promise<boolean>;
    /**
     * 等待弹窗出现
     */
    alert(timeout?: number): Promise<boolean>;
    /**
     * 等待弹窗关闭
     */
    alert_closed(timeout?: number): Promise<ChromiumPage>;
}
