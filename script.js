document.addEventListener("DOMContentLoaded", () => {
    const EDIT_PASSWORD = "111";
    const ADMIN_EMAIL = "gfxxxdb@gmail.com";

    const SUPABASE_URL = "https://mqqcbjgkqwnqxhdzidrj.supabase.co";
    const SUPABASE_KEY = "sb_publishable__HcUXQM2qz_G1WzPD0k3PQ_tZGhZE_2";

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let editing = false;
    let works = [];

    const contentDiv = document.getElementById("content");
    const editBtn = document.getElementById("editBtn");
    const editorPanel = document.getElementById("editorPanel");
    const addWorkBtn = document.getElementById("addWorkBtn");
    const exitEditBtn = document.getElementById("exitEditBtn");
    const resetBtn = document.getElementById("resetBtn");

    // ===== 登录弹窗 =====
    function openLoginModal() {
        return new Promise((resolve) => {
            const modal = document.getElementById("loginModal");
            modal.innerHTML = `
                <div class="login-box">
                    <h2>进入编辑模式</h2>

                    <form id="loginForm">
                        <label>编辑密码</label>
                        <input id="pagePasswordInput" type="password" autocomplete="off">

                        <label>邮箱</label>
                        <input id="emailInput" type="email" autocomplete="username">

                        <label>密码</label>
                        <input id="passwordInput" type="password" autocomplete="current-password">

                        <div class="login-actions">
                            <button type="button" id="cancelBtn">取消</button>
                            <button type="submit">登录</button>
                        </div>
                    </form>
                </div>
            `;

            modal.classList.remove("hidden");

            const form = document.getElementById("loginForm");
            const cancelBtn = document.getElementById("cancelBtn");

            function close(result) {
                modal.classList.add("hidden");
                modal.innerHTML = "";
                resolve(result);
            }

            form.onsubmit = (e) => {
                e.preventDefault();
                close({
                    pagePassword: document.getElementById("pagePasswordInput").value,
                    email: document.getElementById("emailInput").value,
                    password: document.getElementById("passwordInput").value
                });
            };

            cancelBtn.onclick = () => close(null);
        });
    }

    // ===== 登录逻辑 =====
    async function ensureLogin() {
        const { data } = await client.auth.getUser();

        if (data.user && data.user.email === ADMIN_EMAIL) {
            return true;
        }

        const result = await openLoginModal();
        if (!result) return false;

        if (result.pagePassword !== EDIT_PASSWORD) {
            alert("编辑密码错误");
            return false;
        }

        const { data: loginData, error } = await client.auth.signInWithPassword({
            email: result.email,
            password: result.password
        });

        if (error) {
            alert("登录失败：" + error.message);
            return false;
        }

        if (loginData.user.email !== ADMIN_EMAIL) {
            alert("不是管理员账号");
            return false;
        }

        return true;
    }

    // ===== 读取作品 =====
    async function loadWorks() {
        const { data, error } = await client
            .from("works")
            .select("*")
            .order("created_at");

        if (error) {
            console.error(error);
            return;
        }

        works = data || [];
        render();
    }

    // ===== 渲染 =====
    function render() {
        contentDiv.innerHTML = "";

        editorPanel.classList.toggle("hidden", !editing);

        works.forEach(work => {
            const div = document.createElement("div");
            div.className = "work";

            (work.images || []).forEach((img, index) => {
                const image = document.createElement("img");
                image.src = img;
                image.style.width = "200px";

                if (editing) {
                    image.onclick = () => deleteImage(work.id, index);
                }

                div.appendChild(image);
            });

            if (editing) {
                const addBtn = document.createElement("button");
                addBtn.textContent = "+ 上传图片";
                addBtn.onclick = () => chooseImage(work.id);
                div.appendChild(addBtn);
            }

            contentDiv.appendChild(div);
        });
    }

    function chooseImage(workId) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.onchange = () => {
            uploadImage(input.files[0], workId);
        };

        input.click();
    }

    async function uploadImage(file, workId) {
        const fileName = Date.now() + "-" + file.name;

        const { error } = await client.storage
            .from("images")
            .upload(fileName, file);

        if (error) {
            alert("上传失败：" + error.message);
            return;
        }

        const { data } = client.storage
            .from("images")
            .getPublicUrl(fileName);

        const work = works.find(w => w.id === workId);
        const images = work.images || [];

        images.push(data.publicUrl);

        await client
            .from("works")
            .update({ images })
            .eq("id", workId);

        loadWorks();
    }

    async function deleteImage(workId, index) {
        const work = works.find(w => w.id === workId);
        const images = work.images || [];

        images.splice(index, 1);

        await client
            .from("works")
            .update({ images })
            .eq("id", workId);

        loadWorks();
    }

    async function addWork() {
        await client.from("works").insert([{ images: [] }]);
        loadWorks();
    }

    async function resetWorks() {
        if (!confirm("清空所有作品？")) return;

        await client.from("works").delete().neq("id", "0");
        loadWorks();
    }

    // ===== 事件 =====
    editBtn.onclick = async () => {
        if (!editing) {
            const ok = await ensureLogin();
            if (!ok) return;
            editing = true;
        } else {
            editing = false;
        }
        render();
    };

    addWorkBtn.onclick = addWork;
    exitEditBtn.onclick = () => {
        editing = false;
        render();
    };
    resetBtn.onclick = resetWorks;

    loadWorks();
});
