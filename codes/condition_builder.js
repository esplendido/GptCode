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






