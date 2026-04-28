import { CDPSession } from "../core/CDPSession";

export async function close_privacy_dialog(cdpSession: CDPSession): Promise<void> {
  try {
    await cdpSession.send("Runtime.enable");
    await cdpSession.send("DOM.enable");
    await cdpSession.send("DOM.getDocument", { depth: -1 });

    const { searchId } = await cdpSession.send<{ searchId: string }>("DOM.performSearch", {
      query: '//*[name()="privacy-sandbox-notice-dialog-app"]',
      includeUserAgentShadowDOM: true,
    });

    const { nodeIds } = await cdpSession.send<{ nodeIds: number[] }>("DOM.getSearchResults", {
      searchId,
      fromIndex: 0,
      toIndex: 1,
    });

    if (!nodeIds || nodeIds.length === 0 || nodeIds[0] === 0) {
      await cdpSession.send("DOM.discardSearchResults", { searchId }).catch(() => {});
      return;
    }

    let nodeId = nodeIds[0];
    const endTime = Date.now() + 3000;

    while (Date.now() < endTime) {
      try {
        const { node } = await cdpSession.send<{ node: { shadowRoots?: Array<{ backendNodeId: number }> } }>("DOM.describeNode", { nodeId });
        if (node.shadowRoots && node.shadowRoots.length > 0) {
          const shadowBackendId = node.shadowRoots[0].backendNodeId;
          const { object } = await cdpSession.send<{ object: { objectId: string } }>("DOM.resolveNode", {
            backendNodeId: shadowBackendId,
          });

          const { result } = await cdpSession.send<{ result: { objectId?: string } }>("Runtime.callFunctionOn", {
            objectId: object.objectId,
            functionDeclaration: 'function(){return this.getElementById("ackButton");}',
            returnByValue: false,
          });

          if (result.objectId) {
            await cdpSession.send("Runtime.callFunctionOn", {
              objectId: result.objectId,
              functionDeclaration: "function(){return this.click();}",
            });
          }
          break;
        }
      } catch {
        break;
      }
      await new Promise(r => setTimeout(r, 50));
    }

    await cdpSession.send("DOM.discardSearchResults", { searchId }).catch(() => {});
  } catch {}
}
