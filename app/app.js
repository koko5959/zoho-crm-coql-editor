// src/app.js // (Source file: app.js)
const { useState, useEffect } = React;
let dcDomain = "jp"; // Your data center domain / データセンターのドメイン
const connection = "coqlwidget"; // Your connection / 接続名

/* ────────────── ユーティリティ関数 / Utility Functions ────────────── */
// 再帰的に lookup フィールド先のフィールド情報を取得（深さ2まで）
// Fetch the module's fields, the modules are within two depth from the base module.
async function fetchLookupFieldsRecursively(fieldsData, allFieldsSoFar, visitedModules, currentDepth, maxDepth, connection) {
  if (currentDepth >= maxDepth) return;
  const lookupModules = fieldsData
    .filter(f => f.data_type === "lookup" && f.lookup && f.lookup.module)
    .map(f => ({ module: f.lookup.module.api_name, lookup: f }));
  const uniqueMap = new Map();
  lookupModules.forEach(lm => {
    if (!uniqueMap.has(lm.module)) uniqueMap.set(lm.module, lm);
  });
  const uniqueModules = Array.from(uniqueMap.values());
  for (let modObj of uniqueModules) {
    const modName = modObj.module;
    if (!modName || visitedModules.has(modName)) continue;
    visitedModules.add(modName);
    try {
      const invokeUrl = `https://www.zohoapis.${dcDomain}/crm/v7/settings/fields?module=${modName}`;
      const resp = await ZOHO.CRM.CONNECTION.invoke(connection, { url: invokeUrl });
      const subFields = (resp.details.statusMessage.fields) || [];
      subFields.forEach(fieldObj => {
        allFieldsSoFar.push(modObj.lookup.api_name + "." + fieldObj.api_name);
      });
      await fetchLookupFieldsRecursively(subFields, allFieldsSoFar, visitedModules, currentDepth + 1, maxDepth, connection);
    } catch (err) {
      console.error("Error fetching lookup fields for module:", modName, err);
    }
  }
}

// モジュール一覧の取得 / Fetch modules list
async function fetchModules(connection) {
  const resp = await ZOHO.CRM.CONNECTION.invoke(connection, {
    url: `https://www.zohoapis.${dcDomain}/crm/v7/settings/modules`,
  });
  return resp.details.statusMessage.modules;
}

// 指定モジュールのフィールド情報取得 / Fetch fields for a specific module
async function fetchFieldsForModule(modName, connection) {
  const invokeUrl = `https://www.zohoapis.${dcDomain}/crm/v7/settings/fields?module=${modName}`;
  const resp = await ZOHO.CRM.CONNECTION.invoke(connection, { url: invokeUrl });
  return (resp.details.statusMessage.fields) || [];
}

/* ────────────── 動的フィールド編集コンポーネント / Dynamic Field Editing Components ────────────── */

/* ① SelectFieldBuilder
   各行：フィールド選択、aggregator の選択、alias 入力、削除ボタン
   // Each row: field selection, aggregator selection, alias input, remove button
   「+ Add Select Field」ボタンで行追加
   // "+ Add Select Field" button to add a row
*/
function SelectFieldBuilder({ fields, availableFields, onChange }) {
  const aggregatorOptions = ["", "SUM", "MIN", "MAX", "AVG", "COUNT"];
  const handleFieldChange = (index, value) => {
    const newFields = [...fields];
    newFields[index].field = value;
    onChange(newFields);
  };
  const handleAggregatorChange = (index, value) => {
    const newFields = [...fields];
    newFields[index].aggregator = value;
    onChange(newFields);
  };
  const handleAliasChange = (index, value) => {
    const newFields = [...fields];
    newFields[index].alias = value;
    onChange(newFields);
  };
  const handleRemove = (index) => {
    const newFields = fields.filter((_, idx) => idx !== index);
    onChange(newFields);
  };
  const handleAdd = () => {
    onChange([...fields, { field: "", aggregator: "", alias: "" }]);
  };

  return (
    <div className="card mb-4">
      <div className="card-header">Select Fields</div>
      <div className="card-body">
        {fields.map((item, idx) => (
          <div key={idx} className="form-row align-items-center mb-2">
            <div className="col">
              <select
                className="form-control form-control-sm"
                value={item.field}
                onChange={(e) => handleFieldChange(idx, e.target.value)}
              >
                <option value="">--Select Field--</option>
                {availableFields.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="col">
              <select
                className="form-control form-control-sm"
                value={item.aggregator}
                onChange={(e) => handleAggregatorChange(idx, e.target.value)}
              >
                {aggregatorOptions.map(opt => (
                  <option key={opt} value={opt}>{opt || "No aggregator"}</option>
                ))}
              </select>
            </div>
            <div className="col">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Alias"
                value={item.alias}
                onChange={(e) => handleAliasChange(idx, e.target.value)}
              />
            </div>
            <div className="col-auto">
              <button className="btn btn-danger btn-sm" onClick={() => handleRemove(idx)}>Remove</button>
            </div>
          </div>
        ))}
        <button className="btn btn-primary btn-sm" onClick={handleAdd}>+ Add Select Field</button>
      </div>
    </div>
  );
}

/* ② GroupByFieldBuilder
   各行：フィールド選択、削除ボタン、行追加ボタン
   // Each row: field selection, remove button, and add row button
*/
function GroupByFieldBuilder({ fields, availableFields, onChange }) {
  const handleFieldChange = (index, value) => {
    const newFields = [...fields];
    newFields[index].field = value;
    onChange(newFields);
  };
  const handleRemove = (index) => {
    const newFields = fields.filter((_, idx) => idx !== index);
    onChange(newFields);
  };
  const handleAdd = () => {
    onChange([...fields, { field: "" }]);
  };

  return (
    <div className="card mb-4">
      <div className="card-header">Group By Fields</div>
      <div className="card-body">
        {fields.map((item, idx) => (
          <div key={idx} className="form-row align-items-center mb-2">
            <div className="col">
              <select
                className="form-control form-control-sm"
                value={item.field}
                onChange={(e) => handleFieldChange(idx, e.target.value)}
              >
                <option value="">--Select Field--</option>
                {availableFields.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="col-auto">
              <button className="btn btn-danger btn-sm" onClick={() => handleRemove(idx)}>Remove</button>
            </div>
          </div>
        ))}
        <button className="btn btn-primary btn-sm" onClick={handleAdd}>+ Add Group By Field</button>
      </div>
    </div>
  );
}

/* ③ OrderByFieldBuilder
   各行：フィールド選択、昇順／降順選択、削除ボタン、行追加ボタン
   // Each row: field selection, ascending/descending selection, remove button, add row button
*/
function OrderByFieldBuilder({ fields, availableFields, onChange }) {
  const orderOptions = ["ASC", "DESC"];
  const handleFieldChange = (index, value) => {
    const newFields = [...fields];
    newFields[index].field = value;
    onChange(newFields);
  };
  const handleOrderChange = (index, value) => {
    const newFields = [...fields];
    newFields[index].order = value;
    onChange(newFields);
  };
  const handleRemove = (index) => {
    const newFields = fields.filter((_, idx) => idx !== index);
    onChange(newFields);
  };
  const handleAdd = () => {
    onChange([...fields, { field: "", order: "ASC" }]);
  };

  return (
    <div className="card mb-4">
      <div className="card-header">Order By Fields</div>
      <div className="card-body">
        {fields.map((item, idx) => (
          <div key={idx} className="form-row align-items-center mb-2">
            <div className="col">
              <select
                className="form-control form-control-sm"
                value={item.field}
                onChange={(e) => handleFieldChange(idx, e.target.value)}
              >
                <option value="">--Select Field--</option>
                {availableFields.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="col">
              <select
                className="form-control form-control-sm"
                value={item.order}
                onChange={(e) => handleOrderChange(idx, e.target.value)}
              >
                {orderOptions.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="col-auto">
              <button className="btn btn-danger btn-sm" onClick={() => handleRemove(idx)}>Remove</button>
            </div>
          </div>
        ))}
        <button className="btn btn-primary btn-sm" onClick={handleAdd}>+ Add Order By Field</button>
      </div>
    </div>
  );
}

/* ────────────── 従来の WHERE 条件コンポーネント / Traditional WHERE Condition Components ────────────── */
function WhereRow({ row, index, onUpdate, onRemove, displayedFields }) {
  const ops = ["=", "!=", ">=", ">", "<=", "<", "between", "not between", "in", "not in", "is null", "is not null", "like", "not like"];
  const handleFieldChange = (e) => onUpdate(index, { ...row, field: e.target.value });
  const handleOpChange = (e) => onUpdate(index, { ...row, operator: e.target.value });
  const handleValueChange = (e) => onUpdate(index, { ...row, value: e.target.value });
  return (
    <div className="form-row align-items-center mb-2">
      <div className="col-auto">
        <select className="form-control form-control-sm" value={row.field} onChange={handleFieldChange}>
          <option value="">(Select field)</option>
          {displayedFields.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
      <div className="col-auto">
        <select className="form-control form-control-sm" value={row.operator} onChange={handleOpChange}>
          <option value="">(op)</option>
          {ops.map(op => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
      </div>
      <div className="col-auto">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="value"
          value={row.value}
          onChange={handleValueChange}
        />
      </div>
      <div className="col-auto">
        <button className="btn btn-danger btn-sm" onClick={() => onRemove(index)}>Remove</button>
      </div>
    </div>
  );
}

function WhereConditionBuilder({ whereRows, onRowsChange, logicString, onLogicChange, displayedFields }) {
  const handleAddRow = () => {
    const newRow = { field: "", operator: "=", value: "" };
    onRowsChange([...whereRows, newRow]);
  };
  const handleUpdateRow = (index, newRow) => {
    const updated = [...whereRows];
    updated[index] = newRow;
    onRowsChange(updated);
  };
  const handleRemoveRow = (index) => {
    const updated = [...whereRows];
    updated.splice(index, 1);
    onRowsChange(updated);
  };
  return (
    <div className="card mb-4">
      <div className="card-header">WHERE Conditions</div>
      <div className="card-body">
        {whereRows.map((row, idx) => (
          <WhereRow
            key={idx}
            row={row}
            index={idx}
            onUpdate={handleUpdateRow}
            onRemove={handleRemoveRow}
            displayedFields={displayedFields}
          />
        ))}
        <button className="btn btn-primary btn-sm mt-2" onClick={handleAddRow}>+ Add Where Row</button>
        <div className="mt-3">
          <h6>Logic Expression (e.g., (1 AND 2) OR 3)</h6>
          <textarea
            className="form-control"
            rows="2"
            placeholder="(1 AND 2) OR 3"
            value={logicString}
            onChange={(e) => onLogicChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

/* ────────────── Pagination コンポーネント / Pagination Component ────────────── */
function PaginationControls({ limit, offset, onLimitChange, onOffsetChange }) {
  return (
    <div className="card mb-4">
      <div className="card-header">Pagination Controls</div>
      <div className="card-body">
        <div className="form-group">
          <label>Limit (max 2000):</label>
          <input
            type="number"
            className="form-control"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Offset:</label>
          <input
            type="number"
            className="form-control"
            value={offset}
            onChange={(e) => onOffsetChange(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}

/* ────────────── COQL Query 表示＆実行コンポーネント / COQL Query Display & Execution Components ────────────── */
function COQLDisplay({ coqlString, onGenerate, onCoqlChange }) {
  return (
    <div className="card mb-4">
      <div className="card-header">COQL Query</div>
      <div className="card-body">
        <textarea 
          className="form-control mb-3" 
          rows="5" 
          value={coqlString} 
          onChange={(e) => onCoqlChange(e.target.value)} 
          placeholder="Enter your COQL query here or use Generate COQL button"
        />
        <button className="btn btn-success" onClick={onGenerate}>Generate COQL</button>
      </div>
    </div>
  );
}
function COQLDataTable({ coql, connection }) {
  const [tableData, setTableData] = useState([]);
  const [tableError, setTableError] = useState("");
  const [loading, setLoading] = useState(false);
  const [metaInfo, setMetaInfo] = useState(null);

  const execCOQL = async () => {
    if (!coql) {
      setTableError("COQL query is empty.");
      return;
    }
    setLoading(true);
    setTableError("");
    setTableData([]);
    setMetaInfo(null);
    try {
      const req_data = {
        parameters: { select_query: coql },
        method: "POST",
        url: `https://www.zohoapis.${dcDomain}/crm/v7/coql`,
        param_type: 2,
      };
      const resp = await ZOHO.CRM.CONNECTION.invoke(connection, req_data);
      if (resp && resp.details && resp.details.statusMessage && resp.details.statusMessage.data) {
        setTableData(resp.details.statusMessage.data);
        if (resp.details.statusMessage.info) {
          setMetaInfo(resp.details.statusMessage.info);
        }
      } else {
        setTableError("No data found in response.");
      }
    } catch (err) {
      setTableError("Error executing COQL: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];
  return (
    <div className="card mb-4">
      <div className="card-header">COQL Data Table</div>
      <div className="card-body">
        <button className="btn btn-primary mb-3" onClick={execCOQL}>Exec Query</button>
        {loading && <div>Loading data...</div>}
        {tableError && <div className="text-danger">{tableError}</div>}
        {metaInfo && (
          <div className="mb-2 text-muted">
            <div>Count: {metaInfo.count}</div>
            <div>More Records: {metaInfo.more_records ? "Yes" : "No"}</div>
          </div>
        )}
        {tableData.length > 0 && (
          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead>
                <tr>{columns.map((col, idx) => <th key={idx}>{col}</th>)}</tr>
              </thead>
              <tbody>
                {tableData.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {columns.map(col => (
                      <td key={col}>
                        {typeof row[col] === "object" ? JSON.stringify(row[col]) : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────── メイン App コンポーネント / Main App Component ────────────── */
function App() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [baseAllFields, setBaseAllFields] = useState([]);

  // 従来の selectItems, groupByItems, orderByItems をそれぞれ builder 用の state として管理
  // Manage traditional selectItems, groupByItems, orderByItems as state for the builders
  const [selectFields, setSelectFields] = useState([]);     // { field, aggregator, alias }
  const [groupByFields, setGroupByFields] = useState([]);       // { field }
  const [orderByFields, setOrderByFields] = useState([]);       // { field, order }

  const [whereRows, setWhereRows] = useState([]);
  const [whereLogic, setWhereLogic] = useState("");

  const [limit, setLimit] = useState(200);
  const [offset, setOffset] = useState(0);

  const [coqlString, setCoqlString] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const coqlModules = new Set([
    "Leads", "Accounts", "Contacts", "Users", "Deals",
    "Campaigns", "Tasks", "Cases", "Events", "Calls", "Solutions",
    "Products", "Vendors", "Pricebooks", "Quotes", "Salesorders",
    "Purchaseorders", "Invoices"
  ]);

  useEffect(() => {
    setLoading(true);
    ZOHO.embeddedApp.init()
      .then(() => fetchModules(connection))
      .then((mods) => {
        // select COQL applicable modules (coqlModules or custom modules)
        // COQL対象のモジュールを選択 (coqlModulesまたはカスタムモジュール)
        const filteredModules = mods.filter(m =>
          coqlModules.has(m.api_name) ||
          m.generated_type === "custom" ||
          m.generated_type === "subform"
        );
        setModules(filteredModules);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching modules:", err);
        setError("Failed to load modules.");
        setLoading(false);
      });
  }, []);

  async function handleSelectModule(modName) {
    setSelectedModule(modName);
    setBaseAllFields([]);
    // リセット // Reset
    setSelectFields([]);
    setGroupByFields([]);
    setOrderByFields([]);
    setWhereRows([]);
    setWhereLogic("");
    setCoqlString("");
    if (!modName) return;
    try {
      setLoading(true);
      setError("");
      const fieldsData = await fetchFieldsForModule(modName, connection);
      const baseFields = fieldsData.map(fd => fd.api_name);
      const visitedModules = new Set([modName]);
      const allFieldsResult = [...baseFields];
      await fetchLookupFieldsRecursively(fieldsData, allFieldsResult, visitedModules, 0, 2, connection);
      setBaseAllFields(allFieldsResult);
    } catch (e) {
      console.error("Error fetching fields for module:", modName, e);
      setError("Failed to fetch fields.");
    } finally {
      setLoading(false);
    }
  }

  const handleCoqlChange = (newCoql) => {
    setCoqlString(newCoql);
  };

  function generateCOQL() {
    if (!selectedModule) {
      setCoqlString("Please select a base module.");
      return;
    }
    // SELECT句生成：空でない行のみ対象 // Generate SELECT clause: only include non-empty rows
    const selectList = selectFields
      .filter(item => item.field)
      .map(({ field, aggregator, alias }) => {
        let clause = aggregator ? `${aggregator}(${field})` : field;
        if (alias) clause += ` AS '${alias}'`;
        return clause;
      });
    const selectClause = selectList.length ? selectList.join(", ") : "*";
    let query = `select ${selectClause} from ${selectedModule}`;

    // WHERE句生成 // Generate WHERE clause
    let combinedWhereParts = [];
    whereRows.forEach((row, idx) => {
      if (!row.field) return;
      let condition = "";
      if (row.operator.toLowerCase().includes("null")) {
        condition = `(${row.field} ${row.operator})`;
      } else if (row.operator.toLowerCase() === "between") {
        condition = `(${row.field} between ${row.value})`;
      } else {
        condition = `(${row.field} ${row.operator} '${row.value}')`;
      }
      combinedWhereParts.push({ index: idx + 1, text: condition });
    });
    let whereClause = "";
    if (combinedWhereParts.length > 0) {
      if (whereLogic.trim()) {
        whereClause = whereLogic;
        combinedWhereParts.forEach(part => {
          const re = new RegExp(`\\b${part.index}\\b`, "g");
          whereClause = whereClause.replace(re, part.text);
        });
      } else {
        whereClause = combinedWhereParts.map(part => part.text).join(" and ");
      }
    }
    if (whereClause) {
      query += ` where ${whereClause}`;
    }

    // GROUP BY句 // Generate GROUP BY clause
    const groupList = groupByFields
      .filter(item => item.field)
      .map(({ field }) => field);
    if (groupList.length) {
      query += ` group by ${groupList.join(", ")}`;
    }

    // ORDER BY句 // Generate ORDER BY clause
    const orderList = orderByFields
      .filter(item => item.field)
      .map(({ field, order }) => `${field} ${order.toLowerCase()}`);
    if (orderList.length) {
      query += ` order by ${orderList.join(", ")}`;
    }

    // LIMIT/OFFSET句（COQL の構文は "limit offset, limit"） // Generate LIMIT/OFFSET clause (COQL syntax: "limit offset, limit")
    query += ` limit ${offset}, ${limit}`;

    setCoqlString(query);
  }

  if (loading) return <div className="container my-4">Loading...</div>;

  return (
    <div className="container my-4">
      <h2 className="mb-4">Zoho CRM: COQL Builder & DataTable</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* モジュール選択 / Module Selection */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="form-group">
            <label>Base Module:</label>
            <select
              className="form-control"
              value={selectedModule}
              onChange={(e) => handleSelectModule(e.target.value)}
            >
              <option value="">--Select Module--</option>
              {modules.map(m => (
                <option key={m.api_name} value={m.api_name}>
                  {m.api_name + " - " + m.singular_label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 動的にフィールドを追加する各 Builder コンポーネント / Dynamic Field Builder Components */}
      <SelectFieldBuilder
        fields={selectFields}
        availableFields={baseAllFields}
        onChange={setSelectFields}
      />
      <GroupByFieldBuilder
        fields={groupByFields}
        availableFields={baseAllFields}
        onChange={setGroupByFields}
      />
      <OrderByFieldBuilder
        fields={orderByFields}
        availableFields={baseAllFields}
        onChange={setOrderByFields}
      />

      {/* 従来の WHERE 条件 / Traditional WHERE Conditions */}
      <WhereConditionBuilder
        whereRows={whereRows}
        onRowsChange={setWhereRows}
        logicString={whereLogic}
        onLogicChange={setWhereLogic}
        displayedFields={baseAllFields}
      />

      <PaginationControls
        limit={limit}
        offset={offset}
        onLimitChange={setLimit}
        onOffsetChange={setOffset}
      />

      <COQLDisplay 
        coqlString={coqlString} 
        onGenerate={generateCOQL}
        onCoqlChange={handleCoqlChange} 
      />

      <COQLDataTable coql={coqlString} connection={connection} />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
