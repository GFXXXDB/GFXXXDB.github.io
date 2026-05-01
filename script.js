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

        const del = document.createElement("button");
        del.innerText = "删除";
        del.className = "delete-btn";
        del.onclick = () => {
            data.splice(index,1);
            save();
            render();
        };

        block.appendChild(del);

        if(item.type === "image"){
            const imgDiv = document.createElement("div");
            imgDiv.className = "image-block";

            if(item.src){
                const img = document.createElement("img");
                img.src = item.src;
                imgDiv.appendChild(img);
            } else {
                imgDiv.innerText = "点击或拖拽上传图片";
            }

            imgDiv.onclick = () => upload(index);

            imgDiv.ondragover = e => e.preventDefault();

            imgDiv.ondrop = e => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                read(file,index);
            };

            block.appendChild(imgDiv);
        }

        if(item.type === "text"){
            const textarea = document.createElement("textarea");
            textarea.value = item.text || "";
            textarea.oninput = () => {
                data[index].text = textarea.value;
                save();
            };
            block.appendChild(textarea);
        }

        const add = document.createElement("div");
        add.className = "add-block";
        add.innerText = "+ 添加模块";
        add.onclick = () => chooseType(index+1);

        block.appendChild(add);

        contentDiv.appendChild(block);
    });
}

function upload(i){
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
        read(input.files[0],i);
    };
    input.click();
}

function read(file,i){
    const reader = new FileReader();
    reader.onload = () => {
        data[i].src = reader.result;
        save();
        render();
    };
    reader.readAsDataURL(file);
}

function chooseType(pos){
    const type = prompt("输入类型: image 或 text");

    if(type === "image"){
        data.splice(pos,0,{type:"image"});
    }

    if(type === "text"){
        data.splice(pos,0,{type:"text"});
    }

    save();
    render();
}

globalAdd.onclick = () => chooseType(data.length);

editBtn.onclick = () => {
    const p = prompt("输入密码");
    if(p === PASSWORD){
        editing = true;
        alert("进入编辑模式");
    } else {
        alert("错误");
    }
};

render();
