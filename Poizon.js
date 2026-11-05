const url = $request.url;
const body = $response.body;
const DROP_ME = ["creatorCenter", "wallet", "merchant", "discountCoupon", "toolBox"];
const DROP_DISCOVERY = [5, 6, 8, 9];
const DROP_TAB_NAME = /运营频道|玉龙出场/;
function parse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}
function filterTabs(list) {
  if (!Array.isArray(list)) return { list: list, removed: 0 };
  let removed = 0;
  const out = list.filter(function (t) {
    if (!t) return true;
    if (t.cType === 2 || DROP_TAB_NAME.test(String(t.name || ""))) {
      removed++;
      return false;
    }
    return true;
  });
  return { list: out, removed: removed };
}
if (!body) {
  $done({});
} else if (/biz-aggregate\/me\/user-index/.test(url)) {
  const j = parse(body);
  const mods = j && j.data && j.data.modules;
  if (!Array.isArray(mods)) {
    $done({});
  } else {
    const before = mods.length;
    j.data.modules = mods.filter(function (m) {
      return !m || DROP_ME.indexOf(m.key) < 0;
    });
    console.log("DW me modules " + before + " -> " + j.data.modules.length);
    $done({ body: JSON.stringify(j) });
  }
} else if (/identify-discovery\/v1\/discovery\/index/.test(url)) {
  const j = parse(body);
  const groups = j && j.data && j.data.groups;
  if (!Array.isArray(groups)) {
    $done({});
  } else {
    const before = groups.length;
    const out = [];
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const items = Array.isArray(g.items) ? g.items : [];
      const kept = items.filter(function (it) {
        return !it || DROP_DISCOVERY.indexOf(it.entryId) < 0;
      });
      if (kept.length > 0) {
        g.items = kept;
        out.push(g);
      }
    }
    j.data.groups = out;
    console.log("DW discovery groups " + before + " -> " + out.length);
    $done({ body: JSON.stringify(j) });
  }
} else if (/sns-rec\/v1\/du-tab/.test(url)) {
  const j = parse(body);
  const d = j && j.data;
  if (!d) {
    $done({});
  } else {
    let removed = 0;
    const a = filterTabs(d.second);
    d.second = a.list;
    removed += a.removed;
    const b = filterTabs(d.secondMoreV2);
    d.secondMoreV2 = b.list;
    removed += b.removed;
    console.log("DW du-tab removed=" + removed);
    $done({ body: JSON.stringify(j) });
  }
} else {
  $done({});
}
