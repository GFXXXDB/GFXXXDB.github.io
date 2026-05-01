document.addEventListener("DOMContentLoaded", () => {
    const ADMIN_EMAIL = "gfxxxdb@gmail.com";

    const SUPABASE_URL = "https://mqqcbjgkqwnqxhdzidrj.supabase.co";
    const SUPABASE_KEY = "sb_publishable__HcUXQM2qz_G1WzPD0k3PQ_tZGhZE_2";

    const rememberStorageKey = "fl_portfolio_remember_login";
    const rememberLogin = localStorage.getItem(rememberStorageKey) === "yes";

    const storage = rememberLogin ? localStorage : sessionStorage;

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage
        }
    });

    let editing = false;
    let works = [];

    const contentDiv = document.getElementById("content");
    const editBtn = document.getElementById("editBtn");
    const editorPanel = document.getElementById("editorPanel");
    const addWorkBtn = document.getElementById("addWorkBtn");
    const exitEditBtn = document.getElementById("exitEditBtn");
    const changePasswordBtn = document.getElementById("changePasswordBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const resetBtn = document.getElementById("resetBtn");
    const modalRoot = document.getElementById("modalRoot");

    init();

    async function init() {
        await handleRecoveryLink();
        await loadWorks();
    }

    async function getCurrentUser() {
        const { data } = await client.auth.getUser();
        return data?.user || null;
    }

    async function handleRecoveryLink() {
        const hash = window.location.hash || "";
        const query = window.location.search || "";

        const hasRecovery =
            hash.includes("type=recovery") ||
            query.includes("type=recovery") ||
            hash.includes("access_token");

        const hasError =
            hash.includes("error=") ||
            query.includes("error=");

        if (hasError) {
            alert("登录链接已失效，请重新发送密码重置邮件。");
            history.replaceState(null, "", window.location.pathname);
            return;
        }

        if (!hasRecovery) {
            return;
        }

        setTimeout(async () => {
            const user = await getCurrentUser();

            if (!user || user.email !== ADMIN_EMAIL) {
                alert("密码重置链接无效或账号不正确。");
                return;
            }

            await openChangePasswordModal(true);
            history.replaceState(null, "", window.location.pathname);
        }, 500);
    }

    function openModal(html) {
        modalRoot.innerHTML = html;
        modalRoot.classList.remove("hidden");
    }

    function closeModal() {
        modalRoot.classList.add("hidden");
        modalRoot.innerHTML = "";
    }

    function openLoginModal() {
        return new Promise((resolve) => {
            openModal(`
                <div class="modal-box">
                    <h2>进入编辑模式</h2>

                    <form id="loginForm">
                        <label for="emailInput">邮箱</label>
                        <input id="emailInput" name="email" type="email" autocomplete="username" required>

                        <label for="passwordInput">密码</label>
                        <input id="passwordInput" name="password" type="password" autocomplete="current-password" required>

                        <label class="remember-row">
                            <input id="rememberInput" type="checkbox" ${rememberLogin ? "checked" : ""}>
                            <span>保持自动登录这台电脑</span>
                        </label>

                        <div class="modal-actions">
                            <button type="button" id="cancelLoginBtn">取消</button>
                            <button type="submit" class="primary">登录并编辑</button>
                        </div>
                    </form>
                </div>
            `);

            const form = document.getElementById("loginForm");
            const cancelBtn = document.getElementById("cancelLoginBtn");
            const emailInput = document.getElementById("emailInput");

            setTimeout(() => emailInput.focus(), 50);

            form.addEventListener("submit", (event) => {
                event.preventDefault();

                const result = {
                    email: document.getElementById("emailInput").value.trim(),
                    password: document.getElementById("passwordInput").value,
                    remember: document.getElementById("rememberInput").checked
                };

                closeModal();
                resolve(result);
            });

            cancelBtn.addEventListener("click", () => {
                closeModal();
                resolve(null);
            });
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

        if (result.remember) {
            localStorage.setItem(rememberStorageKey, "yes");
        } else {
            localStorage.removeItem(rememberStorageKey);
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

        return true;
    }

    async function openChangePasswordModal(fromRecovery = false) {
        return new Promise((resolve) => {
            openModal(`
                <div class="modal-box">
                    <h2>${fromRecovery ? "设置新密码" : "修改密码"}</h2>

                    <form id="passwordForm">
                        <label for="newPasswordInput">新密码</label>
                        <input id="newPasswordInput" type="password" autocomplete="new-password" required minlength="6">

                        <label for="confirmPasswordInput">确认新密码</label>
                        <input id="confirmPasswordInput" type="password" autocomplete="new-password" required minlength="6">

                        <div class="modal-actions">
                            <button type="button" id="cancelPasswordBtn">取消</button>
                            <button type="submit" class="primary">保存密码</button>
                        </div>
                    </form>
                </div>
            `);

            const form = document.getElementById("passwordForm");
            const cancelBtn = document.getElementById("cancelPasswordBtn");

            form.addEventListener("submit", async (event) => {
                event.preventDefault();

                const p1 = document.getElementById("newPasswordInput").value;
                const p2 = document.getElementById("confirmPasswordInput").value;

                if (p1 !== p2) {
                    alert("两次输入的密码不一致。");
                    return;
                }

                const { error } = await client.auth.updateUser({
                    password: p1
                });

                if (error) {
                    alert("修改密码失败：" + error.message);
                    return;
                }

                closeModal();
                alert("密码已更新。");
                resolve(true);
            });

            cancelBtn.addEventListener("click", () => {
                closeModal();
                resolve(false);
            });
        });
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

    async function compressImage(file) {
        const maxWidth = 2560;
        const quality = 0.88;

        if (!file.type.startsWith("image/")) {
            return file;
        }

        if (file.type === "image/gif") {
            return file;
        }

        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, maxWidth / bitmap.width);
        const width = Math.round(bitmap.width * scale);
        const height = Math.round(bitmap.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(bitmap, 0, 0, width, height);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    resolve(file);
                    return;
                }

                resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                    type: "image/jpeg"
                }));
            }, "image/jpeg", quality);
        });
    }

    async function uploadImageToWork(file, workId, imageIndex) {
        if (!file.type.startsWith("image/")) {
            alert("请选择图片文件。");
            return;
        }

        const uploadFile = await compressImage(file);
        const safeName = uploadFile.name.replace(/[^\w.\-]/g, "_");
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

        const { error: uploadError } = await client.storage
            .from("images")
            .upload(fileName, uploadFile);

        if (uploadError) {
            console.error("图片上传失败：", uploadError);
            alert("图片上传失败：" + uploadError.message);
            return;
        }

        const { data: publicData } = client.storage
            .from("images")
            .getPublicUrl(fileName);

        const work = works.find(item => item.id === workId);

        if (!work) {
            return;
        }

        const images = Array.isArray(work.images) ? [...work.images] : [];
        images[imageIndex] = publicData.publicUrl;

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
            .insert([{ images: [], text: "" }]);

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

        localStorage.removeItem(rememberStorageKey);
        sessionStorage.clear();
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
    changePasswordBtn.addEventListener("click", () => openChangePasswordModal(false));
    logoutBtn.addEventListener("click", logout);
    addWorkBtn.addEventListener("click", addWork);
    resetBtn.addEventListener("click", resetWorks);
});
