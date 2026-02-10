const { ChromiumPage } = require("./dist/pages/ChromiumPage");
const path = require("path");

(async () => {
  const page = new ChromiumPage();
  await page.init();
  const htmlPath = path.resolve(__dirname, "test_page.html");
  await page.get("file:///" + htmlPath.replace(/\\/g, "/"));
  await new Promise(r => setTimeout(r, 1000));

  const parent = await page.ele("#xpath-test");

  // Test via public API
  console.log("=== Testing via parent.eles() ===");
  
  const r1 = await parent.eles("tag:li");
  console.log("tag:li =>", r1.length, "elements");

  const r2 = await parent.eles(".//li");
  console.log(".//li =>", r2.length, "elements");

  const r3 = await parent.eles("xpath:.//li");
  console.log("xpath:.//li =>", r3.length, "elements");

  const r4 = await parent.eles("css:li");
  console.log("css:li =>", r4.length, "elements");

  // Check what parseLocator returns
  const { parseLocator } = require("./dist/core/locator");
  console.log("\n=== parseLocator results ===");
  console.log("tag:li =>", JSON.stringify(parseLocator("tag:li")));
  console.log(".//li =>", JSON.stringify(parseLocator(".//li")));
  console.log("xpath:.//li =>", JSON.stringify(parseLocator("xpath:.//li")));
  console.log("css:li =>", JSON.stringify(parseLocator("css:li")));
  console.log(".//li[2] =>", JSON.stringify(parseLocator(".//li[2]")));

  await page.quit();
})();
