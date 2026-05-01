const PASSWORD = "111";
const STORAGE_KEY = "flll_portfolio_content_v1";

let isEditing = false;

const defaultContent = [
    {
        type: "text",
        text: "这里可以写你的作品说明、项目背景、负责内容、使用软件和制作思路。"
    },
    {
        type: "image",
        image: ""
    },
    {
        type: "image",
        image: ""
    }
];

const portfolioContent = document.getElementById("portfolioContent");
const editBtn = document.getElementById("editBtn");
const editorTools = document.getElementById("editorTools");
const addImageBtn = document.getElementById("addImageBtn");
const addTextBtn = document.getElementById("addTextBtn");
const resetBtn = document.getElementById("resetBtn");
const exitEditBtn = document.getElementById("exitEditBtn");

function loadContent() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultContent;

    try {
        return JSON.parse(saved);
    } catch {
        return defaultContent;
    }
}

function saveContent(content) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
}

function getContent() {
    return loadContent();
}

function setContent(content) {
    saveContent(content);
    render();
}

function render() {
    const content = getContent();
    portfolioContent.innerHTML = "";

    document.body.classList.toggle("editing", isEditing);
    editorTools.classList.toggle("hidden", !isEditing);

    content.forEach((block, index) => {
        if (block.type === "image") {
            portfolioContent.appendChild(createImageBlock(block, index));
        }

        if (block.type === "text") {
            portfolioContent.appendChild(createTextBlock(block, index));
        }
    });
}

function createImageBlock(block, index) {
    const wrapper = document.createElement("article");
    wrapper.className = "portfolio-image-block";

    const actions = document.createElement("div");
    actions.className = "block-actions";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "删除";
    deleteBtn.onclick = () => deleteBlock(index);

    actions.appendChild(deleteBtn);

    const dropArea = document.createElement("div");
    dropArea.className = "image-drop-area";

    if (block.image) {
        const img = document.createElement("img");
        img.src = block.image;
        img.alt = "作品图片";
        dropArea.appendChild(img);
    } else {
        dropArea.innerHTML = isEditing
            ? "拖拽图片到这里<br>或点击选择图片"
            : "作品图片占位";
    }

    if (isEditing) {
        dropArea.addEventListener("click", () => chooseImage(index));
        dropArea.addEventListener("dragover", (event) => {
            event.preventDefault();
            dropArea.classList.add("dragover");
        });

        dropArea.addEventListener("dragleave", () => {
            dropArea.classList.remove("dragover");
        });

        dropArea.addEventListener("drop", (event) => {
            event.preventDefault();
            dropArea.classList.remove("dragover");

            const file = event.dataTransfer.files[0];
            if (file) {
                readImageFile(file, index);
            }
        });
    }

    wrapper.appendChild(actions);
    wrapper.appendChild(dropArea);

    return wrapper;
}

function createTextBlock(block, index) {
    const wrapper = document.createElement("article");
    wrapper.className = "portfolio-text-block";

    const actions = document.createElement("div");
    actions.className = "block-actions";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "删除";
    deleteBtn.onclick = () => deleteBlock(index);

    actions.appendChild(deleteBtn);

    if (isEditing) {
        const textarea = document.createElement("textarea");
        textarea.value = block.text || "";
        textarea.placeholder = "输入作品介绍、项目说明、制作流程等...";
        textarea.addEventListener("input", () => {
            const content = getContent();
            content[index].text = textarea.value;
            saveContent(content);
        });

        wrapper.appendChild(actions);
        wrapper.appendChild(textarea);
    } else {
        const text = document.createElement("div");
        text.className = "text-content";
        text.textContent = block.text || "";

        wrapper.appendChild(actions);
        wrapper.appendChild(text);
    }

    return wrapper;
}

function chooseImage(index) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = () => {
        const file = input.files[0];
        if (file) {
            readImageFile(file, index);
        }
    };

    input.click();
}

function readImageFile(file, index) {
    if (!file.type.startsWith("image/")) {
        alert("请选择图片文件");
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        const content = getContent();
        content[index].image = reader.result;
        setContent(content);
    };

    reader.readAsDataURL(file);
}

function deleteBlock(index) {
    const content = getContent();
    content.splice(index, 1);
    setContent(content);
}

function addImageBlock() {
    const content = getContent();
    content.push({
        type: "image",
        image: ""
    });
    setContent(content);
}

function addTextBlock() {
    const content = getContent();
    content.push({
        type: "text",
        text: "新的文字说明。"
    });
    setContent(content);
}

function enterEditMode() {
    const password = prompt("请输入编辑密码");

    if (password === PASSWORD) {
        isEditing = true;
        render();
    } else {
        alert("密码错误");
    }
}

function exitEditMode() {
    isEditing = false;
    render();
}

function resetContent() {
    const confirmed = confirm("确定要重置所有本地编辑内容吗？");

    if (confirmed) {
        localStorage.removeItem(STORAGE_KEY);
        render();
    }
}

editBtn.addEventListener("click", enterEditMode);
exitEditBtn.addEventListener("click", exitEditMode);
addImageBtn.addEventListener("click", addImageBlock);
addTextBtn.addEventListener("click", addTextBlock);
resetBtn.addEventListener("click", resetContent);

render();
