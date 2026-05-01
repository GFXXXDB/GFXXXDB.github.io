document.addEventListener("DOMContentLoaded", () => {
    const EDIT_PASSWORD = "111";
    const ADMIN_EMAIL = "gfxxxdb@gmail.com";

    const SUPABASE_URL = "https://mqqcbjgkqwnqxhdzidrj.supabase.co";
    const SUPABASE_KEY = "sb_publishable__HcUXQM2qz_G1WzPD0k3PQ_tZGhZE_2";

    // ✅ 这里用 client，避免 supabase 冲突
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let editing = false;
    let works = [];

    const contentDiv = document.getElementById("content");
    const editBtn = document.getElementById("editBtn");
    const editorPanel = document.getElementById("editorPanel");
    const addWorkBtn = document.getElementById("addWorkBtn");
    const exitEditBtn = document.getElementById("exitEditBtn");
    const resetBtn = document.getElementById("resetBtn");

    async function ensureLogin() {
        const { data } = await client.auth.getUser();

        if (data.user && data.user.email === ADMIN_EMAIL) {
            return true;
        }

        const pwd = prompt("输入编辑密码");
        if (pwd !== EDIT_PASSWORD) {
            alert("密码错误");
            return false;
        }

        const email = prompt("Supabase 邮箱");
        const password = prompt("Supabase 密码");

        const { error } = await client.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            alert("登录失败：" + error.message);
            return false;
        }

        return true;
    }

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

    function render() {
        contentDiv.innerHTML = "";

        editorPanel.classList.toggle("hidden", !editing);

        works.forEach(work => {
            const div = document.createElement("div");
            div.className = "work";

            const images = work.images || [];

            images.forEach((img, index) => {
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
            const file = input.files[0];
            uploadImage(file, workId);
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
        if (!confirm("删除这张图片？")) return;

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
