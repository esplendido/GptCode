let root = {
  id: crypto.randomUUID(),
  type: "GROUP",
  logicalOp: "AND",
  children: []
};

function newGroup() {
  return {
    id: crypto.randomUUID(),
    type: "GROUP",
    logicalOp: "AND",
    children: []
  };
}

function newCondition() {
  return {
    id: crypto.randomUUID(),
    type: "CONDITION",
    field: "",
    operator: "=",
    value: ""
  };
}

.group-box {
  border: 2px solid #6c757d;
  border-radius: 6px;
  padding: 8px;
  margin-top: 8px;
  position: relative;
}

.group-level-0 { background-color: #f8f9fa; }
.group-level-1 { background-color: #eef5ff; }
.group-level-2 { background-color: #e6fffa; }
.group-level-3 { background-color: #fff4e6; }

/* 子グループのインデント */
.group-box .children {
  margin-left: 24px;
  padding-left: 12px;
  border-left: 3px dashed #adb5bd;
}

function render(node, level = 0) {
  if (node.type === "GROUP") {
    renderGroup(node, level);
  } else {
    renderCondition(node);
  }
}

function renderGroup(node, level) {
  const $group = $(`
    <div class="group-box group-level-${Math.min(level, 3)}">
      <div class="d-flex align-items-center gap-1 mb-2">
        <span class="badge bg-secondary">GROUP</span>

        <input class="form-control form-control-sm w-25"
               placeholder="node_id">

        <select class="form-select form-select-sm w-auto">
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </select>

        <button class="btn btn-sm btn-outline-primary">+ 条件</button>
        <button class="btn btn-sm btn-outline-secondary">+ グループ</button>
        <button class="btn btn-sm btn-outline-danger">削除</button>
      </div>

      <div class="children"></div>
    </div>
  `);

  $group.find("input").val(node.id);
  $group.find("select").val(node.logicalOp);

  const $children = $group.find(".children");

  node.children.forEach(child => {
    $children.append(render(child, level + 1));
  });

  return $group;
}

.condition-row {
  margin-left: 8px;
  padding: 4px;
  border-left: 3px solid #ced4da;
}

function renderCondition(node) {
  return $(`
    <div class="condition-row d-flex align-items-center gap-1">
      <span class="badge bg-info">COND</span>
      <input class="form-control form-control-sm w-25" value="${node.id}">
      <input class="form-control form-control-sm w-25" value="${node.field}">
      <select class="form-select form-select-sm w-auto">
        <option ${node.operator === "=" ? "selected" : ""}>=</option>
        <option ${node.operator === "IN" ? "selected" : ""}>IN</option>
      </select>
      <input class="form-control form-control-sm w-25" value="${node.value}">
      <button class="btn btn-sm btn-outline-danger">×</button>
    </div>
  `);
}



function removeNode(parent, id) {
  if (!parent.children) return;

  parent.children = parent.children.filter(c => c.id !== id);

  parent.children.forEach(c => removeNode(c, id));
}



function refresh() {
  $("#builder").empty();
  render(root, $("#builder"));
}

refresh();




$("#btnOutput").on("click", () => {
  $("#output").text(JSON.stringify(root, null, 2));
});


//① ツリー → 表形式に変換するロジック（核心）
function flatten(node, parentId = null, order = 1, nodes = [], details = []) {

  // CONDITION_NODE 行
  nodes.push({
    node_id: node.id,
    parent_node_id: parentId,
    node_type: node.type,
    logical_op: node.type === "GROUP" ? node.logicalOp : null,
    sort_order: order
  });

  // CONDITION_DETAIL 行
  if (node.type === "CONDITION") {
    details.push({
      node_id: node.id,
      field: node.field,
      operator: node.operator,
      value: node.value
    });
  }

  // 子を再帰処理
  if (node.children) {
    node.children.forEach((child, idx) => {
      flatten(child, node.id, idx + 1, nodes, details);
    });
  }

  return { nodes, details };
}


<h5 class="mt-4">CONDITION_NODE</h5>
<table class="table table-sm table-bordered">
  <thead>
    <tr>
      <th>node_id</th>
      <th>parent_node_id</th>
      <th>node_type</th>
      <th>logical_op</th>
      <th>sort_order</th>
    </tr>
  </thead>
  <tbody id="nodeTable"></tbody>
</table>

<h5 class="mt-4">CONDITION_DETAIL</h5>
<table class="table table-sm table-bordered">
  <thead>
    <tr>
      <th>node_id</th>
      <th>field</th>
      <th>operator</th>
      <th>value</th>
    </tr>
  </thead>
  <tbody id="detailTable"></tbody>
</table>



$("#btnOutput").on("click", () => {
  const result = flatten(root);

  // CONDITION_NODE
  $("#nodeTable").empty();
  result.nodes.forEach(n => {
    $("#nodeTable").append(`
      <tr>
        <td>${n.node_id}</td>
        <td>${n.parent_node_id ?? ""}</td>
        <td>${n.node_type}</td>
        <td>${n.logical_op ?? ""}</td>
        <td>${n.sort_order}</td>
      </tr>
    `);
  });

  // CONDITION_DETAIL
  $("#detailTable").empty();
  result.details.forEach(d => {
    $("#detailTable").append(`
      <tr>
        <td>${d.node_id}</td>
        <td>${d.field}</td>
        <td>${d.operator}</td>
        <td>${d.value}</td>
      </tr>
    `);
  });
});



<h5 class="mt-4">JSON読み込み</h5>

<textarea id="jsonInput" class="form-control" rows="8"
  placeholder="ここに条件JSONを貼り付けてください"></textarea>

<button id="btnLoadJson" class="btn btn-secondary mt-2">
  JSON読み込み
</button>

$("#btnLoadJson").on("click", () => {
  try {
    const jsonText = $("#jsonInput").val();
    const obj = JSON.parse(jsonText);

    validateNode(obj);   // 構造チェック
    root = obj;          // 置き換え
    refresh();           // UI再描画

  } catch (e) {
    alert("JSONの形式が不正です\n" + e.message);
  }
});

function validateNode(node) {
  if (!node.type || !node.id) {
    throw new Error("type または id がありません");
  }

  if (node.type === "GROUP") {
    if (!node.logicalOp || !Array.isArray(node.children)) {
      throw new Error("GROUPの構造が不正です");
    }
    node.children.forEach(validateNode);
  }

  if (node.type === "CONDITION") {
    if (!node.field || !node.operator) {
      throw new Error("CONDITIONの構造が不正です");
    }
  }
}

//sqlライクの文字列生成
<button id="btnSql" class="btn btn-success mt-3">
  SQLライク文字列出力
</button>

<pre id="sqlOutput" class="mt-3"></pre>


function buildSql(node) {

  // ===== CONDITION =====
  if (node.type === "CONDITION") {
    return buildConditionSql(node);
  }

  // ===== GROUP =====
  const parts = node.children
    .map(child => buildSql(child))
    .filter(s => s && s.length > 0);

  if (parts.length === 0) return "";

  return "(" + parts.join(` ${node.logicalOp} `) + ")";
}

function buildConditionSql(c) {
  if (!c.field || !c.operator) return "";

  switch (c.operator) {
    case "IS NULL":
    case "IS NOT NULL":
      return `${c.field} ${c.operator}`;

    default:
      return `${c.field} ${c.operator} ${formatValue(c.value)}`;
  }
}

function formatValue(v) {
  if (v === null || v === undefined || v === "") {
    return "NULL";
  }

  // 数値っぽい場合
  if (!isNaN(v)) {
    return v;
  }

  // 文字列
  return `'${String(v).replace(/'/g, "''")}'`;
}

$("#btnSql").on("click", () => {
  const sql = buildSql(root);
  $("#sqlOutput").text(sql ? "WHERE " + sql : "");
});



