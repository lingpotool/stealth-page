// 基本 driver 模式验证脚本
// 使用方式：
// 1. 启动一个带远程调试端口的 Chrome，例如：
//    chrome.exe --remote-debugging-port=9222
// 2. 在本项目目录执行：
//    node ./examples/basic_driver_demo.js

const { WebPage, ChromiumOptions } = require("../dist");

async function main() {
  // 根据实际情况修改调试端口
  const options = new ChromiumOptions({ address: "127.0.0.1:9222" ,
    browserPath:"C:/Program Files/Google/Chrome/Application/chrome.exe"
  });

  // d 模式（driver），第二个参数为即将废弃的 timeout，占位为 null
  const page = new WebPage("d", null, options);

  try {
    console.log("[demo] navigating to https://example.com ...");
    await page.get("https://baidu.com");

    const title = await page.title();
    console.log("[demo] page title:", title);

    const html = await page.html();
    console.log("[demo] page html length:", html.length);

    // 尝试查找第一个链接并打印文本
    const link = await page.ele("a", 1);
    if (link) {
      const text = await link.text();
      console.log("[demo] first <a> text:", text);
    } else {
      console.log("[demo] no <a> found on page.");
    }
  } catch (err) {
    console.error("[demo] error:", err);
  } finally {
    // 目前 Chromium/Browser.close 的行为还比较基础，这里暂不强制关闭浏览器
    process.exit(0);
  }
}

main();
