document.addEventListener("DOMContentLoaded", () => {
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
    const logoutBtn = document.getElementById("logoutBtn");
    const resetBtn = document.getElementById("resetBtn");
    const loginModal = document.getElementById("loginModal");

    init();

    async function init() {
        await loadWorks();
    }

    async function getCurrentUser() {
        const { data } = await client.auth.getUser();
        return data?.user || null;
    }

    async function openLoginModal() {
        return new Promise((resolve) => {
            loginModal.innerHTML = `
                <div class="login-box">
                    <h2>进入编辑模式</h2>

                    <form id="loginForm">
                        <label for="emailInput">邮箱</label>
                        <input id="emailInput" name="email" type="email" autocomplete="username" required>

                        <label for="passwordInput">密码</label>
                        <input id="passwordInput" name="password" type="password" autocomplete="current-password" required>

                        <label class="remember-row">
                            <input id="rememberInput" type="checkbox">
                            <span>保持自动登录这台电脑</span>
                        </label>

                        <div class="login-actions">
                            <button type="button" id="cancelLoginBtn">取消</button>
                            <button type="submit" class="primary">登录并编辑</button>
                        </div>
                    </form>
                </div>
            `;

            loginModal.classList.remove("hidden");

            const form = document.getElementById("loginForm");
            const cancelBtn = document.getElementById("cancelLoginBtn");
            const emailInput = document.getElementById("emailInput");

            setTimeout(() => emailInput.focus(), 50);

            function close(result) {
                loginModal.classList.add("hidden");
                loginModal.innerHTML = "";
                resolve(result);
            }

            form.addEventListener("submit", (event) => {
                event.preventDefault();

                close({
                    email: document.getElementById("emailInput").value.trim(),
                    password: document.getElementById("passwordInput").value,
                    remember: document.getElementById("rememberInput").checked
                });
            });

            cancelBtn.addEventListener("click", () => close(null));
        });
    }

    async function ensureLogin() {
        const currentUser = await getCurrentUser();

        if (currentUser?.email === ADMIN_EMAIL) {
            return true;
        }

        const result = await openLoginModal();

        if (!result) {
            return false;
        }

        const { data, error } = await client.auth.signInWithPassword({
            email: result.email,
            password: result.password
        });

        if (error) {
            alert("登录失败：" + error.message);
            return false;
        }

        if (!data.user || data.user.email !== ADMIN_EMAIL) {
            alert("这个账号不是管理员账号。");
            await client.auth.signOut();
            return false;
        }

        if (result.remember) {
            localStorage.setItem("fl_portfolio_auto_login", "yes");
            alert("已保持登录。这台电脑下次点击编辑会直接进入。");
        } else {
            localStorage.removeItem("fl_portfolio_auto_login");
        }

        return true;
    }

    async function loadWorks() {
        const { data, error } = await client
            .from("works")
            .select("*")
            .order("created_at", { ascending: true });

        if (error) {
            console.error("读取作品失败：", error);
            alert("读取作品失败：" + error.message);
            return;
        }

        works = data || [];
        render();
    }

    function render() {
        contentDiv.innerHTML = "";

        document.body.classList.toggle("editing", editing);
        editorPanel.classList.toggle("hidden", !editing);
        editBtn.textContent = editing ? "编辑中" : "编辑";
        editBtn.classList.toggle("editing", editing);

        if (works.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.textContent = editing ? "还没有作品，点击下方「添加作品」开始。" : "暂无作品。";
            contentDiv.appendChild(empty);
            return;
        }

        works.forEach((work) => {
            contentDiv.appendChild(createWorkCard(work));
        });
    }

    function createWorkCard(work) {
        const card = document.createElement("article");
        card.className = "work-card";

        if (editing) {
            const actions = document.createElement("div");
            actions.className = "work-actions";

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "card-action delete";
            deleteBtn.textContent = "删除作品";
            deleteBtn.addEventListener("click", () => deleteWork(work.id));

            actions.appendChild(deleteBtn);
            card.appendChild(actions);
        }

        const imagesWrap = document.createElement("div");
        imagesWrap.className = "work-images";

        const images = Array.isArray(work.images) ? work.images : [];

        if (images.length === 0) {
            imagesWrap.appendChild(createImageBox("", work.id, 0));
        } else {
            images.forEach((src, index) => {
                imagesWrap.appendChild(createImageBox(src, work.id, index));
            });
        }

        card.appendChild(imagesWrap);

        if (editing) {
            const addImageRow = document.createElement("div");
            addImageRow.className = "add-image-row";

            const addImageBtn = document.createElement("button");
            addImageBtn.type = "button";
            addImageBtn.className = "add-image-btn";
            addImageBtn.textContent = "+ 添加图片到这个作品";
            addImageBtn.addEventListener("click", () => chooseImage(work.id, images.length));

            addImageRow.appendChild(addImageBtn);
            card.appendChild(addImageRow);

            const textarea = document.createElement("textarea");
            textarea.className = "work-text-editor";
            textarea.placeholder = "输入作品描述（可选）。不填写时，浏览模式不会显示文字。";
            textarea.value = work.text || "";

            textarea.addEventListener("input", debounce(() => {
                updateWorkText(work.id, textarea.value);
            }, 500));

            card.appendChild(textarea);
        } else if (work.text && work.text.trim() !== "") {
            const text = document.createElement("div");
            text.className = "work-text";
            text.textContent = work.text;
            card.appendChild(text);
        }

        return card;
    }

    function createImageBox(src, workId, imageIndex) {
        const unit = document.createElement("div");
        unit.className = "image-unit";

        if (editing && src) {
            const actions = document.createElement("div");
            actions.className = "image-actions";

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "card-action delete";
            deleteBtn.textContent = "删除图片";
            deleteBtn.addEventListener("click", (event) => {
                event.stopPropagation();
                deleteImage(workId, imageIndex);
            });

            actions.appendChild(deleteBtn);
            unit.appendChild(actions);
        }

        const box = document.createElement("div");
        box.className = src ? "work-image-box has-image" : "work-image-box";

        if (src) {
            const img = document.createElement("img");
            img.src = src;
            img.alt = "作品图片";
            box.appendChild(img);
        } else {
            box.textContent = editing ? "点击或拖拽上传作品图片" : "";
        }

        if (editing) {
            box.addEventListener("click", () => chooseImage(workId, imageIndex));

            box.addEventListener("dragover", (event) => {
                event.preventDefault();
                box.classList.add("dragover");
            });

            box.addEventListener("dragleave", () => {
                box.classList.remove("dragover");
            });

            box.addEventListener("drop", (event) => {
                event.preventDefault();
                box.classList.remove("dragover");

                const file = event.dataTransfer.files[0];

                if (file) {
                    uploadImageToWork(file, workId, imageIndex);
                }
            });
        }

        unit.appendChild(box);
        return unit;
    }

    function chooseImage(workId, imageIndex) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.addEventListener("change", () => {
            const file = input.files?.[0];

            if (file) {
                uploadImageToWork(file, workId, imageIndex);
            }
        });

        input.click();
    }

    async function uploadImageToWork(file, workId, imageIndex) {
        if (!file.type.startsWith("image/")) {
            alert("请选择图片文件。");
            return;
        }

        const safeName = file.name.replace(/[^\w.\-]/g, "_");
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

        const { error: uploadError } = await client.storage
            .from("images")
            .upload(fileName, file);

        if (uploadError) {
            console.error("图片上传失败：", uploadError);
            alert("图片上传失败：" + uploadError.message);
            return;
        }

        const { data: publicData } = client.storage
            .from("images")
            .getPublicUrl(fileName);

        const imageUrl = publicData.publicUrl;

        const work = works.find(item => item.id === workId);

        if (!work) {
            return;
        }

        const images = Array.isArray(work.images) ? [...work.images] : [];
        images[imageIndex] = imageUrl;

        const { error } = await client
            .from("works")
            .update({ images })
            .eq("id", workId);

        if (error) {
            console.error("保存图片失败：", error);
            alert("图片已上传，但保存到作品失败：" + error.message);
            return;
        }

        await loadWorks();
    }

    async function addWork() {
        const { error } = await client
            .from("works")
            .insert([
                {
                    images: [],
                    text: ""
                }
            ]);

        if (error) {
            console.error("添加作品失败：", error);
            alert("添加作品失败：" + error.message);
            return;
        }

        await loadWorks();

        setTimeout(() => {
            const cards = document.querySelectorAll(".work-card");
            const lastCard = cards[cards.length - 1];

            if (lastCard) {
                lastCard.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }
        }, 80);
    }

    async function updateWorkText(workId, text) {
        const { error } = await client
            .from("works")
            .update({ text })
            .eq("id", workId);

        if (error) {
            console.error("保存文字失败：", error);
        }
    }

    async function deleteImage(workId, imageIndex) {
        if (!confirm("确定删除这张图片吗？")) {
            return;
        }

        const work = works.find(item => item.id === workId);

        if (!work) {
            return;
        }

        const images = Array.isArray(work.images) ? [...work.images] : [];
        images.splice(imageIndex, 1);

        const { error } = await client
            .from("works")
            .update({ images })
            .eq("id", workId);

        if (error) {
            console.error("删除图片失败：", error);
            alert("删除图片失败：" + error.message);
            return;
        }

        await loadWorks();
    }

    async function deleteWork(workId) {
        if (!confirm("确定删除整个作品吗？")) {
            return;
        }

        const { error } = await client
            .from("works")
            .delete()
            .eq("id", workId);

        if (error) {
            console.error("删除作品失败：", error);
            alert("删除作品失败：" + error.message);
            return;
        }

        await loadWorks();
    }

    async function resetWorks() {
        if (!confirm("确定清空所有作品吗？这个操作会影响所有访问者看到的内容。")) {
            return;
        }

        const { error } = await client
            .from("works")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");

        if (error) {
            console.error("重置失败：", error);
            alert("重置失败：" + error.message);
            return;
        }

        await loadWorks();
    }

    async function enterEditMode() {
        const ok = await ensureLogin();

        if (!ok) {
            return;
        }

        editing = true;
        render();
    }

    function exitEditMode() {
        editing = false;
        render();
    }

    async function logout() {
        if (!confirm("确定退出登录吗？")) {
            return;
        }

        localStorage.removeItem("fl_portfolio_auto_login");
        await client.auth.signOut();
        editing = false;
        render();
        alert("已退出登录。");
    }

    function debounce(fn, delay) {
        let timer = null;

        return function () {
            clearTimeout(timer);
            timer = setTimeout(fn, delay);
        };
    }

    editBtn.addEventListener("click", () => {
        if (editing) {
            exitEditMode();
        } else {
            enterEditMode();
        }
    });

    exitEditBtn.addEventListener("click", exitEditMode);
    logoutBtn.addEventListener("click", logout);
    addWorkBtn.addEventListener("click", addWork);
    resetBtn.addEventListener("click", resetWorks);
});
