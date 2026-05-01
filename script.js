document.addEventListener("DOMContentLoaded", () => {
    const PASSWORD = "111";
    const STORAGE_KEY = "flll_portfolio_artstation_like_v3";

    let editing = false;

    const contentDiv = document.getElementById("content");
    const editBtn = document.getElementById("editBtn");
    const editorPanel = document.getElementById("editorPanel");
    const addWorkBtn = document.getElementById("addWorkBtn");
    const exitEditBtn = document.getElementById("exitEditBtn");
    const resetBtn = document.getElementById("resetBtn");

    if (!contentDiv || !editBtn || !editorPanel || !addWorkBtn || !exitEditBtn || !resetBtn) {
        console.error("页面元素缺失，请检查 index.html 是否完整替换。");
        return;
    }

    function defaultData() {
        return [
            {
                src: "",
                text: "这里可以写作品说明：项目背景、你的负责内容、使用软件、制作思路、灯光氛围设计等。"
            }
        ];
    }

    function loadData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : defaultData();
        } catch (error) {
            console.error("读取本地数据失败：", error);
            return defaultData();
        }
    }

    let data = loadData();

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            alert("保存失败：图片可能太大。建议压缩图片后再上传。");
            console.error(error);
        }
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

        data.forEach((item, index) => {
            contentDiv.appendChild(createWorkCard(item, index));
        });
    }

    function createWorkCard(item, index) {
        const card = document.createElement("article");
        card.className = "work-card";

        if (editing) {
            const actions = document.createElement("div");
            actions.className = "work-actions";

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "card-action delete";
            deleteBtn.textContent = "删除";
            deleteBtn.addEventListener("click", () => {
                const ok = confirm("确定删除这个作品吗？");
                if (!ok) return;

                data.splice(index, 1);
                save();
                render();
            });

            actions.appendChild(deleteBtn);
            card.appendChild(actions);
        }

        const imageBox = document.createElement("div");
        imageBox.className = "work-image-box";

        if (item.src) {
            const img = document.createElement("img");
            img.src = item.src;
            img.alt = "作品图片";
            imageBox.appendChild(img);
        } else {
            imageBox.textContent = editing ? "点击或拖拽上传作品图片" : "";
        }

        if (editing) {
            imageBox.addEventListener("click", () => chooseImage(index));

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
                    readImage(file, index);
                }
            });
        }

        card.appendChild(imageBox);

        if (editing) {
            const textarea = document.createElement("textarea");
            textarea.className = "work-text-editor";
            textarea.placeholder = "输入作品描述（可选）。不填写时，浏览模式不会显示文字。";
            textarea.value = item.text || "";

            textarea.addEventListener("input", () => {
                data[index].text = textarea.value;
                save();
            });

            card.appendChild(textarea);
        } else {
            if (item.text && item.text.trim() !== "") {
                const text = document.createElement("div");
                text.className = "work-text";
                text.textContent = item.text;
                card.appendChild(text);
            }
        }

        return card;
    }

    function chooseImage(index) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.addEventListener("change", () => {
            const file = input.files && input.files[0];
            if (file) {
                readImage(file, index);
            }
        });

        input.click();
    }

    function readImage(file, index) {
        if (!file.type.startsWith("image/")) {
            alert("请选择图片文件。");
            return;
        }

        const reader = new FileReader();

        reader.addEventListener("load", () => {
            data[index].src = reader.result;
            save();
            render();
        });

        reader.addEventListener("error", () => {
            alert("图片读取失败，请换一张图片试试。");
        });

        reader.readAsDataURL(file);
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

    function addWork() {
        data.push({
            src: "",
            text: ""
        });

        save();
        render();

        setTimeout(() => {
            const cards = document.querySelectorAll(".work-card");
            const lastCard = cards[cards.length - 1];

            if (lastCard) {
                lastCard.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }
        }, 50);
    }

    function resetLocalData() {
        const ok = confirm("这会清空当前浏览器保存的作品内容，确定继续吗？");
        if (!ok) return;

        localStorage.removeItem(STORAGE_KEY);
        data = defaultData();
        save();
        render();
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
    resetBtn.addEventListener("click", resetLocalData);

    render();
});
