const PASSWORD = "111";

let editing = false;

const contentDiv = document.getElementById("content");
const editBtn = document.getElementById("editBtn");
const globalAdd = document.getElementById("globalAdd");

let data = JSON.parse(localStorage.getItem("portfolio")) || [];

function save() {
    localStorage.setItem("portfolio", JSON.stringify(data));
}

function render() {
    contentDiv.innerHTML = "";

    data.forEach((item, index) => {
        const block = document.createElement("div");
        block.className = "block";

        // 删除按钮
        if (editing) {
            const del = document.createElement("button");
            del.innerText = "删除";
            del.className = "delete-btn";
            del.onclick = () => {
                data.splice(index, 1);
                save();
                render();
            };
            block.appendChild(del);
        }

        // 图片区域
        const imgDiv = document.createElement("div");
        imgDiv.className = "image-block";

        if (item.src) {
            const img = document.createElement("img");
            img.src = item.src;
            imgDiv.appendChild(img);
        } else {
            imgDiv.innerText = editing
                ? "点击或拖拽上传图片"
                : "";
        }

        if (editing) {
            imgDiv.onclick = () => upload(index);

            imgDiv.ondragover = e => e.preventDefault();

            imgDiv.ondrop = e => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                read(file, index);
            };
        }

        block.appendChild(imgDiv);

        // ⭐ 文字区域（关键逻辑）
        if (editing) {
            const textarea = document.createElement("textarea");
            textarea.placeholder = "输入作品说明（可选）";
            textarea.value = item.text || "";

            textarea.oninput = () => {
                data[index].text = textarea.value;
                save();
            };

            block.appendChild(textarea);
        } else {
            // 👇 非编辑模式：只有有内容才显示
            if (item.text && item.text.trim() !== "") {
                const textDiv = document.createElement("div");
                textDiv.className = "text-content";
                textDiv.innerText = item.text;
                block.appendChild(textDiv);
            }
        }

        // 添加按钮
        if (editing) {
            const add = document.createElement("div");
            add.className = "add-block";
            add.innerText = "+ 添加作品";
            add.onclick = () => addBlock(index + 1);
            block.appendChild(add);
        }

        contentDiv.appendChild(block);
    });
}

// 添加作品（固定结构：图片+文字）
function addBlock(pos) {
    data.splice(pos, 0, {
        src: "",
        text: ""
    });
    save();
    render();
}

// 上传图片
function upload(i) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = () => {
        read(input.files[0], i);
    };

    input.click();
}

// 读取图片
function read(file, i) {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = () => {
        data[i].src = reader.result;
        save();
        render();
    };

    reader.readAsDataURL(file);
}

// 顶部添加按钮
globalAdd.onclick = () => addBlock(data.length);

// 编辑模式
editBtn.onclick = () => {
    const p = prompt("输入密码");
    if (p === PASSWORD) {
        editing = true;
        render();
    } else {
        alert("密码错误");
    }
};

render();
