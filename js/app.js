// ========== 我的记账目标 ==========
const goalInput = document.querySelector("#goalInput");
const saveGoalBtn = document.querySelector("#saveGoalBtn");

const savedGoal = localStorage.getItem("myGoal");
if (savedGoal) {
    goalInput.value = savedGoal;
}

saveGoalBtn.addEventListener("click", function () {
    localStorage.setItem("myGoal", goalInput.value);
    alert("记账目标保存成功！");
});

// ========== 记一笔 ==========
// 一笔账 = 一个对象 { type, amount, date, category, note, location, id }
// 很多笔账 = 一个数组，存在 "transactions" 里
// localStorage 只能存字符串，所以存的时候 JSON.stringify，取的时候 JSON.parse
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

const amountInput = document.querySelector("#amountInput");
const categoryInput = document.querySelector("#categoryInput");
const dateInput = document.querySelector("#dateInput");
const noteInput = document.querySelector("#noteInput");
const locationInput = document.querySelector("#locationInput");
const addBtn = document.querySelector("#addBtn");
const cancelBtn = document.querySelector("#cancelBtn");
const saveAsTpl = document.querySelector("#saveAsTpl");
const todayExpense = document.querySelector("#todayExpense");
const todayIncome = document.querySelector("#todayIncome");
const monthExpense = document.querySelector("#monthExpense");
const monthIncome = document.querySelector("#monthIncome");
const monthBalance = document.querySelector("#monthBalance");
const transactionList = document.querySelector("#transactionList");
const categoryList = document.querySelector("#categoryList");
const categoryStats = document.querySelector("#categoryStats");
const filterHint = document.querySelector("#filterHint");
const filterName = document.querySelector("#filterName");
const clearFilterBtn = document.querySelector("#clearFilterBtn");
const budgetInput = document.querySelector("#budgetInput");
const budgetBtn = document.querySelector("#budgetBtn");
const budgetSpent = document.querySelector("#budgetSpent");
const budgetLeft = document.querySelector("#budgetLeft");
const budgetBar = document.querySelector("#budgetBar");
const catBudgetCategory = document.querySelector("#catBudgetCategory");
const catBudgetAmount = document.querySelector("#catBudgetAmount");
const catBudgetBtn = document.querySelector("#catBudgetBtn");
const catBudgetList = document.querySelector("#catBudgetList");
const goalName = document.querySelector("#goalName");
const goalTarget = document.querySelector("#goalTarget");
const goalCurrent = document.querySelector("#goalCurrent");
const goalBtn = document.querySelector("#goalBtn");
const goalList = document.querySelector("#goalList");
const noSpendBtn = document.querySelector("#noSpendBtn");
const checkinCount = document.querySelector("#checkinCount");
const checkinStatus = document.querySelector("#checkinStatus");
const calendarEl = document.querySelector("#calendar");
const noSpendHint = document.querySelector("#noSpendHint");
const tplName = document.querySelector("#tplName");
const tplAmount = document.querySelector("#tplAmount");
const tplCategory = document.querySelector("#tplCategory");
const tplBtn = document.querySelector("#tplBtn");
const tplList = document.querySelector("#tplList");

// 拿到"今天"的日期，格式 YYYY-MM-DD，比如 2026-11-01
function getTodayStr() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0"); // 月份是 0-11，所以 +1
    const d = String(now.getDate()).padStart(2, "0");      // padStart 把 1 补成 01
    return y + "-" + m + "-" + d;
}
const todayStr = getTodayStr();
dateInput.value = todayStr; // 日期选择框默认今天

// 兼容旧数据：早期存的账可能缺字段，缺了就补默认值，避免后面 t.date.slice 报错
transactions = transactions.map(function (t, i) {
    return {
        type: t.type === "income" ? "income" : "expense",
        amount: Number(t.amount) || 0,
        date: t.date || todayStr,
        category: t.category || "其他",
        note: t.note || "",
        location: t.location || "",
        id: t.id || (Date.now() + i)
    };
});
localStorage.setItem("transactions", JSON.stringify(transactions));

// ========== 分类：支出和收入各一套 ==========
const expenseCategories = ["餐饮", "交通", "购物", "学习", "娱乐", "居住", "医疗", "人情", "其他"];
const incomeCategories = ["工资", "兼职", "奖学金", "生活费", "退款", "红包", "投资收益", "其他收入"];

function updateCategoryOptions() {
    const type = document.querySelector('input[name="type"]:checked').value;
    const cats = type === "expense" ? expenseCategories : incomeCategories;
    categoryList.innerHTML = "";
    for (const c of cats) {
        const opt = document.createElement("option");
        opt.value = c;
        categoryList.appendChild(opt);
    }
    categoryInput.value = ""; // 换类型时清空已选分类，避免串
}

const typeRadios = document.querySelectorAll('input[name="type"]');
for (const r of typeRadios) {
    r.addEventListener("change", updateCategoryOptions);
}
updateCategoryOptions(); // 打开页面先按默认"支出"填好

function updateTotals() {
    let todayExpenseTotal = 0;
    let todayIncomeTotal = 0;
    let monthExpenseTotal = 0;
    let monthIncomeTotal = 0;

    const thisMonth = todayStr.slice(0, 7); // "2026-11"，取前 7 位

    // 把数组里每一笔过一遍，按类型累加
    for (const t of transactions) {
        if (t.type === "expense") {
            if (t.date === todayStr) todayExpenseTotal += t.amount;
            if (t.date.slice(0, 7) === thisMonth) monthExpenseTotal += t.amount;
        } else {
            if (t.date === todayStr) todayIncomeTotal += t.amount;
            if (t.date.slice(0, 7) === thisMonth) monthIncomeTotal += t.amount;
        }
    }

    todayExpense.textContent = todayExpenseTotal.toFixed(2);
    todayIncome.textContent = todayIncomeTotal.toFixed(2);
    monthExpense.textContent = monthExpenseTotal.toFixed(2);
    monthIncome.textContent = monthIncomeTotal.toFixed(2);
    monthBalance.textContent = (monthIncomeTotal - monthExpenseTotal).toFixed(2);
}

function deleteTransaction(id) {
    // filter：留下"id 不匹配"的，等于把这一笔筛掉
    transactions = transactions.filter(function (t) {
        return t.id !== id;
    });
    localStorage.setItem("transactions", JSON.stringify(transactions));
    renderAll();
}

// editingId = null 表示"新增模式"；有值表示"修改模式"，值是要改的那笔的 id
let editingId = null;

function editTransaction(id) {
    // find：找到第一个 id 匹配的，返回那笔账；找不到返回 undefined
    const t = transactions.find(function (x) {
        return x.id === id;
    });
    if (!t) return;

    // 回填表单
    amountInput.value = t.amount;
    categoryInput.value = t.category;
    dateInput.value = t.date;
    noteInput.value = t.note || "";
    locationInput.value = t.location || "";
    document.querySelector('input[name="type"][value="' + t.type + '"]').checked = true;

    editingId = id;
    addBtn.textContent = "保存修改";
    cancelBtn.hidden = false;
}

function cancelEdit() {
    editingId = null;
    amountInput.value = "";
    categoryInput.value = "";
    dateInput.value = todayStr;
    noteInput.value = "";
    locationInput.value = "";
    addBtn.textContent = "记一笔";
    cancelBtn.hidden = true;
    saveAsTpl.checked = false;
}

function renderList() {
    // 先清空，否则每记一笔，旧条目会再被加一遍
    transactionList.innerHTML = "";

    // 按日期从新到旧排
    transactions.sort(function (a, b) {
        return a.date < b.date ? 1 : -1;
    });

    for (const t of transactions) {
        // 有筛选且这笔不匹配，就跳过
        if (currentFilter && t.category !== currentFilter) {
            continue;
        }

        const li = document.createElement("li");
        const sign = t.type === "expense" ? "-" : "+";
        const typeName = t.type === "expense" ? "支出" : "收入";
        let text = t.date + "  " + t.category + "  " + sign + t.amount.toFixed(2) + " 元  " + typeName;
        if (t.note) {
            text += "  " + t.note;
        }
        if (t.location) {
            text += "  @" + t.location;
        }
        li.textContent = text + "  ";

        const editBtn = document.createElement("button");
        editBtn.textContent = "修改";
        editBtn.addEventListener("click", function () {
            editTransaction(t.id);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "删除";
        deleteBtn.addEventListener("click", function () {
            deleteTransaction(t.id);
        });

        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        transactionList.appendChild(li);
    }
}

// currentFilter = null 显示全部；有值表示只看某个分类
let currentFilter = null;

function updateFilterHint() {
    if (currentFilter) {
        filterHint.hidden = false;
        filterName.textContent = "正在看：" + currentFilter;
    } else {
        filterHint.hidden = true;
    }
}

clearFilterBtn.addEventListener("click", function () {
    currentFilter = null;
    renderAll();
});

function renderStats() {
    categoryStats.innerHTML = "";

    const thisMonth = todayStr.slice(0, 7);
    const totals = {};   // { 分类名: 金额合计 }
    let grandTotal = 0;

    for (const t of transactions) {
        if (t.type === "expense" && t.date.slice(0, 7) === thisMonth) {
            const key = t.category || "未分类";
            totals[key] = (totals[key] || 0) + t.amount;
            grandTotal += t.amount;
        }
    }

    if (grandTotal === 0) {
        categoryStats.innerHTML = "<li>本月还没有支出</li>";
        return;
    }

    const keys = Object.keys(totals);
    keys.sort(function (a, b) {
        return totals[b] - totals[a]; // 按金额从高到低
    });

    for (const key of keys) {
        const pct = (totals[key] / grandTotal) * 100;

        const li = document.createElement("li");
        li.className = "stat-row";

        const label = document.createElement("span");
        label.className = "stat-label";
        label.textContent = key;

        const barWrap = document.createElement("div");
        barWrap.className = "stat-bar-wrap";

        const bar = document.createElement("div");
        bar.className = "stat-bar";
        bar.style.width = pct.toFixed(1) + "%";

        barWrap.appendChild(bar);

        const value = document.createElement("span");
        value.textContent = totals[key].toFixed(2) + " 元  " + pct.toFixed(1) + "%";

        li.addEventListener("click", function () {
            currentFilter = key;
            renderAll();
        });

        li.appendChild(label);
        li.appendChild(barWrap);
        li.appendChild(value);
        categoryStats.appendChild(li);
    }
}

// ========== 预算 ==========
let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;
budgetInput.value = monthlyBudget || "";

budgetBtn.addEventListener("click", function () {
    const b = Number(budgetInput.value);
    if (b < 0) {
        alert("预算不能是负数");
        return;
    }
    monthlyBudget = b;
    localStorage.setItem("monthlyBudget", String(b));
    renderBudget();
});

function budgetColor(pct) {
    // 0% 是绿（hue 120），100% 是红（hue 0），中间慢慢经过橙黄
    const capped = Math.min(pct, 100);
    const hue = 120 * (1 - capped / 100);
    return "hsl(" + hue + ", 60%, 45%)";
}

function renderBudget() {
    const thisMonth = todayStr.slice(0, 7);
    let spent = 0;
    for (const t of transactions) {
        if (t.type === "expense" && t.date.slice(0, 7) === thisMonth) {
            spent += t.amount;
        }
    }

    budgetSpent.textContent = spent.toFixed(2);

    if (monthlyBudget > 0) {
        const left = monthlyBudget - spent;
        const over = left < 0;

        budgetLeft.textContent = left.toFixed(2);
        budgetLeft.style.color = over ? "#c0392b" : "";

        const pct = Math.min(spent / monthlyBudget * 100, 100);
        budgetBar.style.width = pct.toFixed(1) + "%";
        budgetBar.style.background = budgetColor(pct);
    } else {
        budgetLeft.textContent = "0.00";
        budgetLeft.style.color = "";
        budgetBar.style.width = "0%";
        budgetBar.style.background = "#7a9e7e";
    }
}

// ========== 分类预算 ==========
let categoryBudgets = JSON.parse(localStorage.getItem("categoryBudgets")) || [];

catBudgetBtn.addEventListener("click", function () {
    const cat = catBudgetCategory.value;
    const amt = Number(catBudgetAmount.value);
    if (!cat) { alert("请填分类"); return; }
    if (!amt || amt <= 0) { alert("金额要大于 0"); return; }

    const existing = categoryBudgets.find(function (b) { return b.category === cat; });
    if (existing) {
        existing.amount = amt;   // 这个分类已经设过，就更新金额
    } else {
        categoryBudgets.push({ category: cat, amount: amt });
    }

    localStorage.setItem("categoryBudgets", JSON.stringify(categoryBudgets));
    catBudgetCategory.value = "";
    catBudgetAmount.value = "";
    renderCatBudget();
});

function deleteCatBudget(category) {
    categoryBudgets = categoryBudgets.filter(function (b) { return b.category !== category; });
    localStorage.setItem("categoryBudgets", JSON.stringify(categoryBudgets));
    renderCatBudget();
}

function renderCatBudget() {
    catBudgetList.innerHTML = "";

    if (categoryBudgets.length === 0) {
        catBudgetList.innerHTML = "<li>还没有分类预算</li>";
        return;
    }

    const thisMonth = todayStr.slice(0, 7);
    const spentByCat = {};
    for (const t of transactions) {
        if (t.type === "expense" && t.date.slice(0, 7) === thisMonth) {
            const key = t.category || "未分类";
            spentByCat[key] = (spentByCat[key] || 0) + t.amount;
        }
    }

    for (const b of categoryBudgets) {
        const spent = spentByCat[b.category] || 0;
        const left = b.amount - spent;
        const over = left < 0;
        const pct = Math.min(spent / b.amount * 100, 100);

        const li = document.createElement("li");
        li.className = "budget-row";

        const label = document.createElement("span");
        label.className = "stat-label";
        label.textContent = b.category;

        const barWrap = document.createElement("div");
        barWrap.className = "stat-bar-wrap";
        const bar = document.createElement("div");
        bar.className = "stat-bar";
        bar.style.width = pct.toFixed(1) + "%";
        bar.style.background = budgetColor(pct);
        barWrap.appendChild(bar);

        const value = document.createElement("span");
        value.textContent = spent.toFixed(2) + "/" + b.amount.toFixed(2) + " 元";
        value.style.color = over ? "#c0392b" : "";

        const delBtn = document.createElement("button");
        delBtn.textContent = "删";
        delBtn.addEventListener("click", function () {
            deleteCatBudget(b.category);
        });

        li.appendChild(label);
        li.appendChild(barWrap);
        li.appendChild(value);
        li.appendChild(delBtn);
        catBudgetList.appendChild(li);
    }
}

// ========== 储蓄目标 ==========
let savingGoals = JSON.parse(localStorage.getItem("savingGoals")) || [];

// 兼容旧数据：老目标没有 records，补成空数组
savingGoals = savingGoals.map(function (g) {
    return {
        name: g.name || "未命名",
        target: Number(g.target) || 0,
        current: Number(g.current) || 0,
        records: g.records || [],
        id: g.id || Date.now()
    };
});
localStorage.setItem("savingGoals", JSON.stringify(savingGoals));

goalBtn.addEventListener("click", function () {
    const name = goalName.value;
    const target = Number(goalTarget.value);
    const current = Number(goalCurrent.value);

    if (!name) { alert("请填目标名称"); return; }
    if (!target || target <= 0) { alert("目标金额要大于 0"); return; }
    if (current < 0) { alert("当前金额不能是负数"); return; }

    savingGoals.push({ name: name, target: target, current: current, records: [], id: Date.now() });
    saveGoals();

    goalName.value = "";
    goalTarget.value = "";
    goalCurrent.value = "";
    renderGoals();
});

function saveGoals() {
    localStorage.setItem("savingGoals", JSON.stringify(savingGoals));
}

function deposit(id) {
    const g = savingGoals.find(function (x) { return x.id === id; });
    if (!g) return;
    const amt = Number(prompt("存入多少？"));
    if (!amt || amt <= 0) { alert("金额要大于 0"); return; }
    g.current += amt;
    g.records.push({ type: "存入", amount: amt, date: todayStr });
    saveGoals();
    renderGoals();
}

function withdraw(id) {
    const g = savingGoals.find(function (x) { return x.id === id; });
    if (!g) return;
    const amt = Number(prompt("取出多少？"));
    if (!amt || amt <= 0) { alert("金额要大于 0"); return; }
    if (amt > g.current) { alert("取出的不能超过当前金额"); return; }
    g.current -= amt;
    g.records.push({ type: "取出", amount: amt, date: todayStr });
    saveGoals();
    renderGoals();
}

function deleteGoal(id) {
    savingGoals = savingGoals.filter(function (g) { return g.id !== id; });
    saveGoals();
    renderGoals();
}

function renderGoals() {
    goalList.innerHTML = "";
    if (savingGoals.length === 0) {
        goalList.innerHTML = "<li>还没有储蓄目标</li>";
        return;
    }

    for (const g of savingGoals) {
        const reached = g.current >= g.target;
        const pct = Math.min(g.current / g.target * 100, 100);

        const li = document.createElement("li");
        li.className = "budget-row";

        const label = document.createElement("span");
        label.className = "stat-label";
        label.textContent = g.name;

        const barWrap = document.createElement("div");
        barWrap.className = "stat-bar-wrap";
        const bar = document.createElement("div");
        bar.className = "stat-bar";
        bar.style.width = pct.toFixed(1) + "%";
        barWrap.appendChild(bar);

        const value = document.createElement("span");
        value.textContent = (reached ? "已完成　" : "") + g.current.toFixed(2) + "/" + g.target.toFixed(2) + " 元　" + pct.toFixed(1) + "%";

        const depositBtn = document.createElement("button");
        depositBtn.textContent = "存入";
        depositBtn.addEventListener("click", function () { deposit(g.id); });

        const withdrawBtn = document.createElement("button");
        withdrawBtn.textContent = "取出";
        withdrawBtn.addEventListener("click", function () { withdraw(g.id); });

        const delBtn = document.createElement("button");
        delBtn.textContent = "删";
        delBtn.addEventListener("click", function () {
            deleteGoal(g.id);
        });

        li.appendChild(label);
        li.appendChild(barWrap);
        li.appendChild(value);
        li.appendChild(depositBtn);
        li.appendChild(withdrawBtn);
        li.appendChild(delBtn);
        goalList.appendChild(li);

        // 显示最近 5 条流水
        if (g.records.length > 0) {
            const history = document.createElement("li");
            history.className = "goal-history";
            history.textContent = g.records.slice(-5).map(function (r) {
                return r.date + " " + r.type + " " + r.amount.toFixed(2);
            }).join("；");
            goalList.appendChild(history);
        }
    }
}

// ========== 有效记账日 ==========
let noSpendDays = JSON.parse(localStorage.getItem("noSpendDays")) || [];

noSpendBtn.addEventListener("click", function () {
    if (noSpendDays.indexOf(todayStr) === -1) {
        noSpendDays.push(todayStr);
        localStorage.setItem("noSpendDays", JSON.stringify(noSpendDays));
    }
    renderCheckin();
});

function renderCheckin() {
    const TARGET = 25;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();                    // 0-11
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();  // 0=周日

    const thisMonth = todayStr.slice(0, 7);
    const recorded = {};   // 已记录的日期集合
    for (const t of transactions) {
        if (t.date.slice(0, 7) === thisMonth) recorded[t.date] = true;
    }
    for (const d of noSpendDays) {
        if (d.slice(0, 7) === thisMonth) recorded[d] = true;
    }

    const count = Object.keys(recorded).length;
    checkinCount.textContent = count;
    checkinStatus.textContent = count >= TARGET ? "（已达标）" : "（最低 " + TARGET + " 天，还差 " + (TARGET - count) + " 天）";

    // 画本月日历
    calendarEl.innerHTML = "";

    for (let i = 0; i < firstWeekday; i++) {
        const empty = document.createElement("div");
        empty.className = "cal-cell cal-empty";
        calendarEl.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement("div");
        cell.className = "cal-cell";
        cell.textContent = day;

        const dateStr = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
        if (recorded[dateStr]) {
            cell.classList.add("done");
        }
        calendarEl.appendChild(cell);
    }

    const confirmed = noSpendDays.indexOf(todayStr) !== -1;
    noSpendHint.textContent = confirmed ? "（今天已确认无收支）" : "";
}

// ========== 固定收支模板 ==========
let templates = JSON.parse(localStorage.getItem("templates")) || [];

templates = templates.map(function (t) {
    return {
        name: t.name || "未命名",
        type: t.type === "income" ? "income" : "expense",
        amount: Number(t.amount) || 0,
        category: t.category || "",
        id: t.id || Date.now()
    };
});
localStorage.setItem("templates", JSON.stringify(templates));

function saveTemplates() {
    localStorage.setItem("templates", JSON.stringify(templates));
}

tplBtn.addEventListener("click", function () {
    const name = tplName.value;
    const type = document.querySelector('input[name="tplType"]:checked').value;
    const amount = Number(tplAmount.value);
    const category = tplCategory.value;

    if (!name) { alert("请填名称"); return; }
    if (!amount || amount <= 0) { alert("金额要大于 0"); return; }

    templates.push({ name: name, type: type, amount: amount, category: category, id: Date.now() });
    saveTemplates();
    tplName.value = "";
    tplAmount.value = "";
    tplCategory.value = "";
    renderTemplates();
});

function generateFromTemplate(id) {
    const tpl = templates.find(function (x) { return x.id === id; });
    if (!tpl) return;

    transactions.push({
        type: tpl.type,
        amount: tpl.amount,
        date: todayStr,
        category: tpl.category || "其他",
        note: tpl.name,
        location: "",
        id: Date.now()
    });
    localStorage.setItem("transactions", JSON.stringify(transactions));
    renderAll();
}

function deleteTemplate(id) {
    templates = templates.filter(function (t) { return t.id !== id; });
    saveTemplates();
    renderTemplates();
}

function renderTemplates() {
    tplList.innerHTML = "";
    if (templates.length === 0) {
        tplList.innerHTML = "<li>还没有固定模板</li>";
        return;
    }

    for (const t of templates) {
        const sign = t.type === "expense" ? "-" : "+";
        const li = document.createElement("li");
        li.textContent = t.name + "（" + (t.type === "expense" ? "支出" : "收入") + "）" + sign + t.amount.toFixed(2) + " 元　";

        const genBtn = document.createElement("button");
        genBtn.textContent = "生成";
        genBtn.addEventListener("click", function () { generateFromTemplate(t.id); });

        const delBtn = document.createElement("button");
        delBtn.textContent = "删";
        delBtn.addEventListener("click", function () { deleteTemplate(t.id); });

        li.appendChild(genBtn);
        li.appendChild(delBtn);
        tplList.appendChild(li);
    }
}

function renderAll() {
    updateTotals();
    renderList();
    renderStats();
    updateFilterHint();
    renderBudget();
    renderCatBudget();
    renderGoals();
    renderCheckin();
    renderTemplates();
}

addBtn.addEventListener("click", function () {
    // 拿金额，Number() 把输入框里的字符串变成数字
    const amount = Number(amountInput.value);

    // 测试用例：金额不能为空、不能小于等于 0
    if (!amount || amount <= 0) {
        alert("金额要大于 0 才能记");
        return;
    }

    // 拿类型：看哪个单选被勾了
    const type = document.querySelector('input[name="type"]:checked').value;

    // 拿分类
    const category = categoryInput.value;

    // 拿备注和地点（都可选，可以为空）
    const note = noteInput.value;
    const loc = locationInput.value;

    // 拿日期：用户没选就默认今天
    const date = dateInput.value || todayStr;

    if (editingId !== null) {
        // 修改模式：找到那笔，更新它的字段
        const t = transactions.find(function (x) {
            return x.id === editingId;
        });
        t.type = type;
        t.amount = amount;
        t.category = category;
        t.date = date;
        t.note = note;
        t.location = loc;
    } else {
        // 新增模式：push 一笔新的（id 用 Date.now()，不会重复）
        transactions.push({ type: type, amount: amount, date: date, category: category, note: note, location: loc, id: Date.now() });

        // 顺手存成固定模板
        if (saveAsTpl.checked) {
            templates.push({
                name: note || category || "未命名",
                type: type,
                amount: amount,
                category: category,
                id: Date.now()
            });
            saveTemplates();
        }
    }
    localStorage.setItem("transactions", JSON.stringify(transactions));

    // 收尾：恢复成"新增模式"的样子，刷新数字和列表
    cancelEdit();
    renderAll();
});

// ========== 模式：简洁版 / 综合版 ==========
let mode = localStorage.getItem("mode") || null;

const welcome = document.querySelector("#welcome");
const app = document.querySelector("#app");
const chooseSimple = document.querySelector("#chooseSimple");
const chooseFull = document.querySelector("#chooseFull");
const modeToggleBtn = document.querySelector("#modeToggleBtn");

function applyMode() {
    if (!mode) {
        welcome.hidden = false;
        app.hidden = true;
        return;
    }
    welcome.hidden = true;
    app.hidden = false;

    const fullOnly = document.querySelectorAll(".full-only");
    for (const el of fullOnly) {
        el.hidden = (mode === "simple");
    }
    modeToggleBtn.textContent = mode === "simple" ? "切到综合版" : "切到简洁版";
}

chooseSimple.addEventListener("click", function () {
    mode = "simple";
    localStorage.setItem("mode", mode);
    applyMode();
});

chooseFull.addEventListener("click", function () {
    mode = "full";
    localStorage.setItem("mode", mode);
    applyMode();
});

modeToggleBtn.addEventListener("click", function () {
    mode = mode === "simple" ? "full" : "simple";
    localStorage.setItem("mode", mode);
    applyMode();
});

applyMode();

// 页面一打开，先把已有账单算一遍、列一遍
renderAll();
