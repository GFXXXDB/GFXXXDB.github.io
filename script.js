const SUPABASE_URL = "https://mqcqbjgkqwnqxdzidrj.supabase.co";
const SUPABASE_KEY = "sb_publishable__HcUXQM2qz_G1WzPD0k3PQ_tZGhZE_2";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isEditMode = false;
let currentUser = null;

const content = document.getElementById("content");
const editBtn = document.getElementById("editBtn");
const editorPanel = document.getElementById("editorPanel");
const exitEditBtn = document.getElementById("exitEditBtn");
const addWorkBtn = document.getElementById("addWorkBtn");

const YOUR_EMAIL = "gfxxxdb@gmail.com"; // 改成你的

// ===== 初始化 =====
init();

async function init() {
    await checkLogin();
    loadWorks();
}

// ===== 检查登录状态 =====
async function checkLogin() {
    const { data } = await supabase.auth.getUser();

    if (data.user && data.user.email === YOUR_EMAIL) {
        currentUser = data.user;
        enableEditModeUI();
    }
}

// ===== 点击编辑按钮 =====
editBtn.addEventListener("click", async () => {
    if (!currentUser) {
        const password = prompt("请输入编辑密码");

        if (password !== "111") {
            alert("密码错误");
            return;
        }

        const email = prompt("请输入 Supabase 邮箱");
        const pwd = prompt("请输入 Supabase 密码");

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: pwd
        });

        if (error) {
            alert("登录失败");
            return;
        }

        if (data.user.email !== YOUR_EMAIL) {
            alert("不是管理员账号");
            return;
        }

        currentUser = data.user;
    }

    isEditMode = true;
    enableEditModeUI();
    loadWorks();
});

// ===== 启用编辑 UI =====
function enableEditModeUI() {
    editorPanel.classList.remove("hidden");
}

// ===== 退出编辑 =====
exitEditBtn.addEventListener("click", () => {
    isEditMode = false;
    editorPanel.classList.add("hidden");
    loadWorks();
});

// ===== 加载作品 =====
async function loadWorks() {
    content.innerHTML = "";

    const { data, error } = await supabase
        .from("works")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(work => {
        renderWork(work);
    });
}

// ===== 渲染作品 =====
function renderWork(work) {
    const div = document.createElement("div");
    div.className = "work-card";

    const images = (work.images || []).map(url => {
        return `<img src="${url}" />`;
    }).join("");

    div.innerHTML = `
        <div class="images">${images}</div>
        <p>${work.text || ""}</p>
    `;

    if (isEditMode) {
        const del = document.createElement("button");
        del.innerText = "删除";
        del.onclick = () => deleteWork(work.id);
        div.appendChild(del);
    }

    content.appendChild(div);
}

// ===== 删除 =====
async function deleteWork(id) {
    if (!confirm("确定删除？")) return;

    await supabase.from("works").delete().eq("id", id);
    loadWorks();
}

// ===== 添加作品 =====
addWorkBtn.addEventListener("click", async () => {
    const text = prompt("输入描述");

    await supabase.from("works").insert({
        text,
        images: []
    });

    loadWorks();
});
