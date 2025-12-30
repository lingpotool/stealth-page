/**
 * 基础调试测试
 */
const { ChromiumPage } = require("./dist");

async function test() {
  const page = new ChromiumPage("127.0.0.1:9222");
  
  // 测试1: 用 data: URL
  console.log("=== 测试 data: URL ===");
  await page.get("data:text/html,<h1 id='test'>Hello</h1>");
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("URL:", await page.url());
  console.log("Title:", await page.title());
  
  const html = await page.html();
  console.log("HTML 长度:", html.length);
  console.log("HTML 包含 Hello:", html.includes("Hello"));
  
  const el = await page.ele("#test");
  console.log("ele('#test'):", el);
  
  // 测试2: 用真实网页
  console.log("\n=== 测试真实网页 ===");
  await page.get("https://www.baidu.com");
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("URL:", await page.url());
  console.log("Title:", await page.title());
  
  const el2 = await page.ele("#kw");
  console.log("ele('#kw'):", el2);
  if (el2) {
    console.log("  tag:", await el2.tag);
    console.log("  id:", await el2.attr("id"));
  }
  
  const links = await page.eles("a");
  console.log("eles('a') 数量:", links.length);
  
  const xpathLinks = await page.eles("//a");
  console.log("eles('//a') 数量:", xpathLinks.length);
}

test().catch(console.error);
