import { CDPSession } from "./CDPSession";
import { Element, ElementHandleRef } from "./Element";
import { ShadowRoot } from "./ShadowRoot";

export interface JsResultContext {
  session: CDPSession;
  getPage?(): any;
}

export async function parseJsResult(
  ctx: JsResultContext,
  result: any,
  endTime?: number
): Promise<any> {
  if (!result) return null;

  if ('unserializableValue' in result) {
    return result.unserializableValue;
  }

  const theType = result.type;

  if (theType === 'object') {
    const subType = result.subtype || null;

    if (subType === 'null') {
      return null;
    }

    if (subType === 'node') {
      const className = result.className;
      if (className === 'ShadowRoot') {
        const placeholderEle = new Element(ctx.session, { backendNodeId: 0 });
        return new ShadowRoot(placeholderEle, { objId: result.objectId });
      }
      if (className === 'HTMLDocument') {
        return result;
      }
      const eles = await makeChromiumEles(ctx, result.objectId);
      if (eles === false) {
        throw new Error('Element no longer exists');
      }
      return eles;
    }

    if (subType === 'array') {
      const propsResult = await ctx.session.send<{
        result: Array<{ name: string; value?: any }>
      }>("Runtime.getProperties", {
        objectId: result.objectId,
        ownProperties: true,
      });
      const items = [];
      for (const prop of propsResult.result) {
        if (/^\d+$/.test(prop.name) && prop.value) {
          items.push(await parseJsResult(ctx, prop.value, endTime));
        }
      }
      return items;
    }

    if (result.className === 'Blob' && result.objectId) {
      try {
        const { uuid } = await ctx.session.send<{ uuid: string }>("IO.resolveBlob", {
          objectId: result.objectId,
        });
        const data = await ctx.session.send<{ data: string }>("IO.read", {
          handle: `blob:${uuid}`,
        });
        return data.data;
      } catch {
        return null;
      }
    }

    if ('objectId' in result && result.objectId) {
      const timeout = endTime ? endTime - Date.now() : 30000;
      if (timeout < 0) return null;
      const r = await ctx.session.send<{
        result: any
      }>("Runtime.callFunctionOn", {
        functionDeclaration: "function(){return JSON.stringify(this);}",
        objectId: result.objectId,
        returnByValue: true,
        awaitPromise: true,
        userGesture: true,
      });
      if (r.result && r.result.value !== undefined) {
        try {
          return JSON.parse(r.result.value);
        } catch {
          return r.result.value;
        }
      }
      return result.value || result;
    }

    return result.value !== undefined ? result.value : result;
  }

  if (theType === 'undefined') {
    return null;
  }

  if (theType === 'function') {
    return result.description || null;
  }

  return result.value;
}

async function makeChromiumEles(
  ctx: JsResultContext,
  objectId: string
): Promise<Element | false> {
  try {
    await ctx.session.send("DOM.getDocument", { depth: -1 });
    const { nodeId } = await ctx.session.send<{ nodeId: number }>("DOM.requestNode", {
      objectId,
    });
    if (nodeId <= 0) return false;

    const { node } = await ctx.session.send<{ node: { backendNodeId: number } }>("DOM.describeNode", {
      nodeId,
    });
    const ref: ElementHandleRef = { nodeId, backendNodeId: node.backendNodeId };
    const ele = new Element(ctx.session, ref, ctx.getPage?.());
    return ele;
  } catch {
    return false;
  }
}

export function convertArgument(arg: any): any {
  if (arg instanceof Element) {
    if (arg.backendNodeId > 0) {
      return { backendNodeId: arg.backendNodeId };
    }
    return { value: arg };
  }

  if (arg === null || arg === undefined) {
    return { unserializableValue: arg === null ? 'null' : 'undefined' };
  }

  if (typeof arg === 'number') {
    if (arg === Infinity) return { unserializableValue: 'Infinity' };
    if (arg === -Infinity) return { unserializableValue: '-Infinity' };
    if (Number.isNaN(arg)) return { unserializableValue: 'NaN' };
    return { value: arg };
  }

  if (typeof arg === 'string' || typeof arg === 'boolean') {
    return { value: arg };
  }

  if (typeof arg === 'object') {
    return { value: arg };
  }

  return { value: arg };
}
