# DrissionPage → stealth-page 对齐审查任务

## 审查方法
对比 Python `.pyi` 类型定义与 Node.js `.ts` 实现，确保公共 API 100% 对齐。

---

## 一、核心页面类

### 1. chromium_base.pyi → ChromiumBase.ts ✅ 已完成
- [x] 属性: timeout, timeouts, browser, driver, title, url, html, json, tab_id, load_mode, user_agent, upload_list, _js_ready_state, _target_id, _browser_url
- [x] 方法: get, refresh, forward, back, _forward_or_back, stop_loading, remove_ele, add_ele
- [x] 方法: ele, eles, s_ele, s_eles, _find_elements
- [x] 方法: get_frame, get_frames, session_storage, local_storage
- [x] 方法: run_cdp, run_cdp_loaded, _run_cdp, _run_cdp_loaded
- [x] 方法: run_js, run_js_loaded, _run_js, _run_js_loaded, run_async_js
- [x] 方法: get_screenshot, _get_screenshot, screenshot
- [x] 方法: add_init_js, remove_init_js
- [x] 方法: clear_cache, disconnect, reconnect
- [x] 方法: handle_alert, _handle_alert, _wait_loaded, _on_alert_open, _on_alert_close
- [x] 方法: cookies, set_cookies
- [x] 属性: wait, set, screencast, actions, listen, states, scroll, rect, console
- [x] 内部方法: _d_set_runtime_settings(不需要), _connect_browser(不需要), _driver_init(不需要), _get_document(不需要), _wait_to_stop(不需要), _onXxx 事件(不需要)
- 注: session属性(Python的requests.Session)不需要对齐，Node.js用fetch替代

### 2. chromium_page.pyi → ChromiumPage.ts ✅ 已完成
- [x] 属性: set, wait, browser, tabs_count, tab_ids, latest_tab, process_id, browser_version, address
- [x] 方法: save, get_tab, get_tabs, new_tab, activate_tab, close, close_tabs, quit, _on_disconnect

### 3. chromium_tab.pyi → ChromiumTab.ts ✅ 已完成
- [x] 属性: set, wait, save (继承自ChromiumBase)
- [x] 方法: close(others), _on_disconnect

### 4. chromium_frame.pyi → ChromiumFrame.ts ✅ 已完成
- [x] 属性: scroll, set, states, wait, rect, listen, owner, frame_ele, tag, url, html, inner_html, link, title, attrs, active_ele, xpath, css_path, tab, tab_id, download_path, sr, shadow_root, child_count, _js_ready_state
- [x] 方法: refresh, property, attr, remove_attr, style, run_js, _run_js, parent, prev, next, before, after, prevs, nexts, befores, afters
- [x] 方法: get_screenshot, _get_screenshot, _find_elements, _is_inner_frame, _reload, _get_document

### 5. mix_tab.pyi → MixTab.ts ✅ 已完成
- [x] 属性和方法对齐 (set, wait, url, _browser_url, title, raw_data, html, json, response, mode, user_agent, session, _session_url, timeout)
- [x] 方法: get, post, ele, eles, s_ele, s_eles, change_mode, cookies_to_session, cookies_to_browser, cookies, close, _find_elements

### 6. web_page.pyi → WebPage.ts ✅ 已完成
- [x] 属性和方法对齐 (set, wait, mode, response, chromium_page, session_page, get, post, ele, eles, change_mode, cookies, close, quit)

### 7. session_page.pyi → SessionPage.ts ✅ 已完成
- [x] 属性和方法对齐 (get, post, ele, eles, html, json, url, title, cookies, session, response)

---

## 二、元素类

### 8. chromium_element.pyi → Element.ts ✅ 已完成
- [x] 属性: tag, html, inner_html, attrs, text, raw_text, set, states, pseudo, rect, shadow_root, sr, scroll, click, wait, select, value
- [x] 导航: parent, child, prev, next, before, after, children, prevs, nexts, befores, afters
- [x] 方向: over, offset, east, south, west, north, _get_relative_eles
- [x] 操作: check, attr, remove_attr, property, run_js, _run_js, run_async_js, ele, eles, s_ele, s_eles
- [x] 操作: style, src, save, get_screenshot, input, clear, _input_focus, focus, hover, drag, drag_to
- [x] 内部: _get_obj_id, _get_node_id, _get_backend_id, _refresh_id, _get_ele_path, _set_file_input, _find_elements

### 9. shadow_root (在 chromium_element.pyi) → ShadowRoot.ts ✅ 已完成
- [x] 属性: tag, html, inner_html, states
- [x] 方法: run_js, _run_js, run_async_js, parent, child, next, before, after, children, nexts, befores, afters, ele, eles, s_ele, s_eles
- [x] 内部: _find_elements, _get_node_id, _get_obj_id, _get_backend_id

### 10. none_element.pyi → NoneElement.ts ✅ 已完成
- [x] 属性和方法对齐 (isNone, text, value, 所有方法返回自身或配置值)

### 11. session_element.pyi → SessionElement.ts ✅ 已完成
- [x] 属性和方法对齐 (tag, html, inner_html, attrs, text, ele, eles, parent, child, prev, next等)

---

## 三、Units 模块

### 12. waiter.pyi → 各 Waiter 文件 ✅ 已完成
- [x] ElementWaiter: deleted, displayed, hidden, covered, not_covered, enabled, disabled, disabled_or_deleted, clickable, has_rect, stop_moving, _wait_state
- [x] BrowserWaiter: new_tab, download_begin, downloads_done
- [x] ChromiumPageWaiter: ele_deleted, ele_displayed, ele_hidden, eles_loaded, load_start, doc_loaded, upload_paths_inputted, download_begin, url_change, title_change, new_tab, all_downloads_done, alert_closed
- [x] FrameWaiter: 对齐
- [x] MixTabWaiter: 对齐
- [x] WebPageWaiter: 对齐

### 13. states.pyi → 各 States 文件 ✅ 已完成
- [x] ElementStates: is_selected, is_checked, is_displayed, is_enabled, is_alive, is_in_viewport, is_whole_in_viewport, is_covered, is_clickable, has_rect
- [x] ShadowRootStates: is_enabled, is_alive
- [x] BrowserStates: is_alive, is_headless, is_existed, is_incognito
- [x] PageStates: is_loading, is_alive, ready_state, has_alert, is_headless, is_existed, is_incognito
- [x] FrameStates: is_loading, is_alive, ready_state, is_displayed, has_alert

### 14. setter.pyi → 各 Setter 文件 ✅ 已完成
- [x] BrowserSetter: cookies, window, auto_handle_alert, download_path, download_file_name, when_download_file_exists
- [x] ChromiumPageSetter: load_mode, timeouts, scroll, cookies, headers, user_agent, session_storage, local_storage, upload_files, auto_handle_alert, blocked_urls
- [x] ElementSetter: attr, property, style, innerHTML, value
- [x] ChromiumFrameSetter: attr, property, style
- [x] LoadMode: normal, eager, none
- [x] WindowSetter: max, mini, full, normal, size, location, hide, show

### 15. listener.pyi → Listener.ts ✅ 已完成
- [x] Listener: listening, targets, is_regex, method, res_type, data, start, stop, wait
- [x] DataPacket: tab_id, target, is_failed, url, method, request, response, body, resourceType, base64_body

### 16. clicker.pyi → ElementClicker.ts ✅ 已完成
- [x] __call__, left, right, middle, at, multi, to_download, to_upload, for_new_tab, for_url_change, for_title_change

### 17. scroller.pyi → 各 Scroller 文件 ✅ 已完成
- [x] ElementScroller: to_see, to_center, to_top, to_bottom, to_half, to_rightmost, to_leftmost, to_location, up, down, left, right
- [x] PageScroller: to_see, to_top, to_bottom, to_half, to_rightmost, to_leftmost, to_location, up, down, left, right
- [x] FrameScroller: 对齐

### 18. rect.pyi → 各 Rect 文件 ✅ 已完成
- [x] ElementRect: corners, viewport_corners, size, location, midpoint, click_point, viewport_location, viewport_midpoint, viewport_click_point, screen_location, screen_midpoint, screen_click_point, scroll_position
- [x] PageRect: window_state, window_location, window_size, page_location, viewport_location, size, viewport_size, viewport_size_with_scrollbar, scroll_position
- [x] FrameRect: 对齐

### 19. actions.pyi → ChromiumPageActions.ts ✅ 已完成
- [x] move_to, move, click, r_click, m_click, hold, release, r_hold, r_release, m_hold, m_release, scroll, up, down, left, right, key_down, key_up, type, input, drag_in, wait

### 20. selector.pyi → SelectElement.ts ✅ 已完成
- [x] is_multi, options, selected_option, selected_options, all, invert, clear, by_text, by_value, by_index, by_locator, by_option, cancel_by_text, cancel_by_value, cancel_by_index, cancel_by_locator, cancel_by_option

### 21. screencast.pyi → Screencast.ts ✅ 已完成
- [x] set_mode, start, stop, set_save_path

### 22. console.pyi → Console.ts ✅ 已完成
- [x] messages, start, stop, clear, wait, steps

### 23. downloader.pyi → DownloadManager.ts ✅ 已完成
- [x] DownloadManager: missions, set_path, set_rename, set_file_exists, set_flag, get_flag, get_tab_missions, set_done, cancel, skip, clear_tab_info
- [x] DownloadMission: rate, is_done, cancel, wait

### 24. cookies_setter.pyi → 各 CookiesSetter 文件 ✅ 已完成
- [x] BrowserCookiesSetter: set, clear
- [x] CookiesSetter: set, remove, clear

---

## 四、基础类

### 25. chromium.pyi → Chromium.ts ✅ 已完成
- [x] 属性: user_data_path, process_id, timeout, timeouts, load_mode, download_path, set, states, wait, tabs_count, tab_ids, latest_tab, cookies
- [x] 方法: new_tab, get_tab, get_tabs, close_tabs, _close_tab, activate_tab, reconnect, clear_cache, quit, _new_tab, _get_tab, _get_tabs, _run_cdp, version

### 26. driver.pyi → (CDP Driver) ✅ 已完成
- [x] CDPSession 类对齐

### 27. base.pyi → (Base classes) ✅ 已完成
- [x] BaseElement, DrissionElement 等基类对齐

---

## 五、Functions 模块

### 28. settings.pyi → Settings.ts ✅ 已完成
- [x] raise_when_ele_not_found, raise_when_click_failed, raise_when_wait_failed, singleton_tab_obj, cdp_timeout, browser_connect_timeout, auto_handle_alert, suffixes_list
- [x] set_raise_when_ele_not_found, set_raise_when_click_failed, set_raise_when_wait_failed, set_singleton_tab_obj, set_cdp_timeout, set_browser_connect_timeout, set_auto_handle_alert, set_suffixes_list

### 29. web.pyi → web.ts ✅ 已完成
- [x] get_ele_txt, format_html, location_in_viewport, offset_scroll, make_absolute_link, is_js_func, get_blob, save_page, get_mhtml, get_pdf, tree, format_headers

### 30. locator.pyi → locator.ts ✅ 已完成
- [x] 定位符解析对齐 (parseLocator, css_trans, is_str_loc, get_loc, str_to_xpath_loc, str_to_css_loc)

### 31. keys.pyi → Keys.ts ✅ 已完成
- [x] 键盘按键常量对齐 (Keys, keyDefinitions, modifierBit, keysToTyping, make_input_data)

### 32. tools.pyi → tools.ts ✅ 已完成
- [x] 工具函数对齐 (raise_error, port_is_using)

### 33. cookies.pyi → cookies.ts ✅ 已完成
- [x] Cookie 工具函数对齐 (format_cookie, format_cookies, make_cookie_info, set_tab_cookie, CookiesList, cookie_to_dict, cookies_to_tuple)

### 34. elements.pyi → (元素查找辅助) ✅ 已完成
- [x] 元素查找辅助功能已集成到 Element.ts 和 locator.ts 中

### 35. browser.pyi → (浏览器启动辅助) ✅ 已完成
- [x] 浏览器启动辅助功能已集成到 Chromium.ts 中

---

## 六、Configs 模块

### 36. chromium_options.pyi → ChromiumOptions.ts ✅ 已完成
- [x] 选项配置对齐 (address, browser_path, arguments, extensions, load_mode, timeouts, headless, incognito, auto_port, download_path, user_data_path)

### 37. session_options.pyi → SessionOptions.ts ✅ 已完成
- [x] 选项配置对齐

### 38. options_manage.pyi → OptionsManager.ts ✅ 已完成
- [x] 选项管理对齐

---

## 七、__init__.pyi → index.ts ✅ 已完成
- [x] 导出对齐
