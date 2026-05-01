const PASSWORD = "111";

let editing = false;

const contentDiv = document.getElementById("content");
const editBtn = document.getElementById("editBtn");

let data = JSON.parse(localStorage.getItem("portfolio")) || [];

function save(){
    localStorage.setItem("portfolio", JSON.stringify(data));
}

function render(){
    contentDiv.innerHTML = "";

    document.body.classList.toggle("editing", editing);

    data.forEach((item, index) => {

        const block = document.createElement("div");
        block.className = "block";

        // 删除按钮（仅编辑模式）
        if(editing){
            const del = document.createElement("button");
            del.innerText = "删除";
            del.className = "delete-btn";
            del.onclick = () => {
                data.splice(index,1);
                save();
                render();
            };
            block.appendChild(del);
        }

        // 图片
        const imgDiv = document.createElement("div");
        imgDiv.className = "image-block";

        if(item.src){
            const img = document.createElement("img");
            img.src = item.src;
            imgDiv.appendChild(img);
        }else{
            imgDiv.innerText = editing ? "点击或拖拽上传图片" : "";
        }

        // 只有编辑模式才允许操作
        if(editing){
            imgDiv.onclick = () => upload(index);

            imgDiv.ondragover = e => e.preventDefault();

            imgDiv.ondrop = e => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                read(file,index);
            };
        }

        block.appendChild(imgDiv);

        // 文字
        if(editing){
            const textarea = document.createElement("textarea");
            textarea.value = item.text || "";
            textarea.placeholder = "输入作品说明（可选）";

            textarea.oninput = () => {
                data[index].text = textarea.value;
                save();
            };

            block.appendChild(textarea);
        }else{
            if(item.text && item.text.trim() !== ""){
                const text = document.createElement("div");
                text.className = "text-content";
                text.innerText = item.text;
                block.appendChild(text);
            }
        }

        // 添加按钮（只在编辑模式）
        if(editing){
            const add = document.createElement("div");
            add.className = "add-block";
            add.innerText = "+ 添加作品";
            add.onclick = () => addBlock(index+1);
            block.appendChild(add);
        }

        contentDiv.appendChild(block);
    });
}

function addBlock(pos){
    data.splice(pos,0,{src:"",text:""});
    save();
    render();
}

function upload(i){
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => read(input.files[0],i);
    input.click();
}

function read(file,i){
    if(!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
        data[i].src = reader.result;
        save();
        render();
    };
    reader.readAsDataURL(file);
}

// 🔥 编辑按钮逻辑（关键）
editBtn.onclick = () => {

    if(editing){
        // 退出
        editing = false;
        render();
        return;
    }

    const p = prompt("输入密码");

    if(p === PASSWORD){
        editing = true;
        render();
    }else{
        alert("密码错误");
    }
};

// 初始数据（避免空白）
if(data.length === 0){
    data.push({src:"",text:""});
}

render();
