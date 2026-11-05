const url = $request.url;
const body = $response.body;
const DROP_ME = ["wallet", "merchant", "discountCoupon", "toolBox"];
const DROP_DISCOVERY = [5, 6, 8, 9];
function parse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
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
} else {
  $done({});
}
