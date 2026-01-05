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


function render(node, $container) {

  // ===== GROUP =====
  if (node.type === "GROUP") {
    const $group = $(`
      <div class="group-box">
        <div class="d-flex align-items-center mb-2">
          <select class="form-select form-select-sm w-auto me-2">
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>

          <button class="btn btn-sm btn-outline-primary me-1">+ 条件</button>
          <button class="btn btn-sm btn-outline-secondary me-1">+ グループ</button>
          <button class="btn btn-sm btn-outline-danger">削除</button>
        </div>
        <div class="children"></div>
      </div>
    `);

    $group.find("select").val(node.logicalOp)
      .on("change", function () {
        node.logicalOp = this.value;
      });

    // 条件追加
    $group.find(".btn-outline-primary").on("click", () => {
      node.children.push(newCondition());
      refresh();
    });

    // グループ追加
    $group.find(".btn-outline-secondary").on("click", () => {
      node.children.push(newGroup());
      refresh();
    });

    // 削除（root以外）
    $group.find(".btn-outline-danger").on("click", () => {
      removeNode(root, node.id);
      refresh();
    });

    // 子ノード再帰描画
    node.children.forEach(child => {
      render(child, $group.find(".children"));
    });

    $container.append($group);
  }

  // ===== CONDITION =====
  if (node.type === "CONDITION") {
    const $cond = $(`
      <div class="condition-row d-flex align-items-center">
        <input class="form-control form-control-sm me-1 w-25" placeholder="field">
        <select class="form-select form-select-sm me-1 w-auto">
          <option>=</option>
          <option>!=</option>
          <option>></option>
          <option><</option>
          <option>>=</option>
          <option><=</option>
        </select>
        <input class="form-control form-control-sm me-1 w-25" placeholder="value">
        <button class="btn btn-sm btn-outline-danger">×</button>
      </div>
    `);

    $cond.find("input:eq(0)").val(node.field)
      .on("input", e => node.field = e.target.value);

    $cond.find("select").val(node.operator)
      .on("change", e => node.operator = e.target.value);

    $cond.find("input:eq(1)").val(node.value)
      .on("input", e => node.value = e.target.value);

    $cond.find("button").on("click", () => {
      removeNode(root, node.id);
      refresh();
    });

    $container.append($cond);
  }
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



