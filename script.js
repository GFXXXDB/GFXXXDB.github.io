document.addEventListener("DOMContentLoaded", () => {
    const PASSWORD = "111";

    const SUPABASE_URL = "https://mqqcbjgkqwnqxhdzidrj.supabase.co";
    const SUPABASE_KEY = "sb_publishable__HcUXQM2qz_G1WzPD0k3PQ_tZGhZE_2";

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let editing = false;
    let data = [];

    const contentDiv = document.getElementById("content");
    const editBtn = document.getElementById("editBtn");
    const editorPanel = document.getElementById("editorPanel");
    const addWorkBtn = document.getElementById("addWorkBtn");
    const exitEditBtn = document.getElementById("exitEditBtn");
    const resetBtn = document.getElementById("resetBtn");

    async function loadWorks() {
        const { data: works, error } = await client
            .from("works")
            .select("*")
            .order("created_at", { ascending: true });

        if (error) {
            console.error("读取作品失败：", error);
            alert("读取作品失败，请检查 Supabase 表和 RLS 权限。");
            return;
        }

        data = works || [];
        render();
    }

    function render() {
        contentDiv.innerHTML = "";

        document.body.classList.toggle("editing", editing);
        editorPanel.classList.toggle("hidden", !editing);
        editBtn.textContent = editing ? "编辑中" : "编辑";
        editBtn.classList.toggle("editing", editing);

        if (data.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.textContent = editing ? "还没有作品，点击下方「添加作品」开始。" : "暂无作品。";
            contentDiv.appendChild(empty);
            return;
        }

        data.forEach((work, workIndex) => {
            contentDiv.appendChild(createWorkCard(work, workIndex));
        });
    }

    function createWorkCard(work, workIndex) {
        const card = document.createElement("article");
        card.className = "work-card";

        if (editing) {
            const workActions = document.createElement("div");
            workActions.className = "work-actions";

            const deleteWorkBtn = document.createElement("button");
            deleteWorkBtn.type = "button";
            deleteWorkBtn.className = "card-action delete";
            deleteWorkBtn.textContent = "删除作品";
            deleteWorkBtn.addEventListener("click", () => deleteWork(work.id));

            workActions.appendChild(deleteWorkBtn);
            card.appendChild(workActions);
        }

        const imagesWrap = document.createElement("div");
        imagesWrap.className = "work-images";

        const images = Array.isArray(work.images) ? work.images : [];

        if (images.length === 0) {
            imagesWrap.appendChild(createImageBox("", work.id, 0, true));
        } else {
            images.forEach((src, imageIndex) => {
                imagesWrap.appendChild(createImageBox(src, work.id, imageIndex, false));
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

    function createImageBox(src, workId, imageIndex, isPlaceholder) {
        const unit = document.createElement("div");
        unit.className = "image-unit";

        if (editing && !isPlaceholder) {
            const imageActions = document.createElement("div");
            imageActions.className = "image-actions";

            const deleteImageBtn = document.createElement("button");
            deleteImageBtn.type = "button";
            deleteImageBtn.className = "card-action delete";
            deleteImageBtn.textContent = "删除图片";
            deleteImageBtn.addEventListener("click", (event) => {
                event.stopPropagation();
                deleteImage(workId, imageIndex);
            });

            imageActions.appendChild(deleteImageBtn);
            unit.appendChild(imageActions);
        }

        const imageBox = document.createElement("div");
        imageBox.className = src ? "work-image-box has-image" : "work-image-box";

        if (src) {
            const img = document.createElement("img");
            img.src = src;
            img.alt = "作品图片";
            imageBox.appendChild(img);
        } else {
            imageBox.textContent = editing ? "点击或拖拽上传作品图片" : "";
        }

        if (editing) {
            imageBox.addEventListener("click", () => chooseImage(workId, imageIndex));

            imageBox.addEventListener("dragover", (event) => {
                event.preventDefault();
                imageBox.classList.add("dragover");
            });

            imageBox.addEventListener("dragleave", () => {
                imageBox.classList.remove("dragover");
            });

            imageBox.addEventListener("drop", (event) => {
                event.preventDefault();
                imageBox.classList.remove("dragover");

                const file = event.dataTransfer.files[0];
                if (file) {
                    uploadImageToWork(file, workId, imageIndex);
                }
            });
        }

        unit.appendChild(imageBox);
        return unit;
    }

    function chooseImage(workId, imageIndex) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.addEventListener("change", () => {
            const file = input.files && input.files[0];
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

        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await client.storage
            .from("images")
            .upload(fileName, file);

        if (uploadError) {
            console.error("图片上传失败：", uploadError);
            alert("图片上传失败，请确认 Storage 里已经创建 public 的 images bucket。");
            return;
        }

        const { data: publicData } = client.storage
            .from("images")
            .getPublicUrl(fileName);

        const imageUrl = publicData.publicUrl;

        const work = data.find(item => item.id === workId);
        if (!work) return;

        const images = Array.isArray(work.images) ? [...work.images] : [];
        images[imageIndex] = imageUrl;

        const { error } = await client
            .from("works")
            .update({ images })
            .eq("id", workId);

        if (error) {
            console.error("保存图片失败：", error);
            alert("图片已上传，但保存到作品失败。");
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
            alert("添加作品失败，请检查 INSERT Policy。");
            return;
        }

        await loadWorks();
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
        if (!confirm("确定删除这张图片吗？")) return;

        const work = data.find(item => item.id === workId);
        if (!work) return;

        const images = Array.isArray(work.images) ? [...work.images] : [];
        images.splice(imageIndex, 1);

        const { error } = await client
            .from("works")
            .update({ images })
            .eq("id", workId);

        if (error) {
            console.error("删除图片失败：", error);
            alert("删除图片失败。");
            return;
        }

        await loadWorks();
    }

    async function deleteWork(workId) {
        if (!confirm("确定删除整个作品吗？")) return;

        const { error } = await client
            .from("works")
            .delete()
            .eq("id", workId);

        if (error) {
            console.error("删除作品失败：", error);
            alert("删除作品失败，请检查 DELETE Policy。");
            return;
        }

        await loadWorks();
    }

    async function resetWorks() {
        if (!confirm("确定清空所有作品吗？这个操作会影响所有访问者看到的内容。")) return;

        const { error } = await client
            .from("works")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");

        if (error) {
            console.error("重置失败：", error);
            alert("重置失败。");
            return;
        }

        await loadWorks();
    }

    function enterEditMode() {
        const password = prompt("请输入编辑密码");

        if (password === PASSWORD) {
            editing = true;
            render();
        } else if (password !== null) {
            alert("密码错误。");
        }
    }

    function exitEditMode() {
        editing = false;
        render();
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
    addWorkBtn.addEventListener("click", addWork);
    resetBtn.addEventListener("click", resetWorks);

    loadWorks();
});
