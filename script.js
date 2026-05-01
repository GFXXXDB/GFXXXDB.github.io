const PASSWORD = "111";
let editing = false;

const contentDiv = document.getElementById("content");
const editBtn = document.getElementById("editBtn");
const globalAdd = document.getElementById("globalAdd");

let data = JSON.parse(localStorage.getItem("portfolio")) || [];

function save(){
    localStorage.setItem("portfolio",JSON.stringify(data));
}

function render(){
    contentDiv.innerHTML="";

    data.forEach((item,index)=>{
        const block=document.createElement("div");
        block.className="block";

        if(editing){
            const del=document.createElement("button");
            del.innerText="删除";
            del.className="delete-btn";
            del.onclick=()=>{
                data.splice(index,1);
                save();
                render();
            };
            block.appendChild(del);
        }

        // 图片
        const imgDiv=document.createElement("div");
        imgDiv.className="image-block";

        if(item.src){
            const img=document.createElement("img");
            img.src=item.src;
            imgDiv.appendChild(img);
        }else{
            imgDiv.innerText=editing?"拖拽或点击上传图片":"";
        }

        if(editing){
            imgDiv.onclick=()=>upload(index);

            imgDiv.ondragover=e=>e.preventDefault();

            imgDiv.ondrop=e=>{
                e.preventDefault();
                const file=e.dataTransfer.files[0];
                read(file,index);
            };
        }

        block.appendChild(imgDiv);

        // 文字
        if(editing){
            const textarea=document.createElement("textarea");
            textarea.placeholder="输入作品说明（可选）";
            textarea.value=item.text||"";

            textarea.oninput=()=>{
                data[index].text=textarea.value;
                save();
            };

            block.appendChild(textarea);
        }else{
            if(item.text && item.text.trim()!==""){
                const text=document.createElement("div");
                text.className="text-content";
                text.innerText=item.text;
                block.appendChild(text);
            }
        }

        if(editing){
            const add=document.createElement("div");
            add.className="add-block";
            add.innerText="+ 添加作品";
            add.onclick=()=>addBlock(index+1);
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
    const input=document.createElement("input");
    input.type="file";
    input.accept="image/*";
    input.onchange=()=>read(input.files[0],i);
    input.click();
}

function read(file,i){
    const reader=new FileReader();
    reader.onload=()=>{
        data[i].src=reader.result;
        save();
        render();
    };
    reader.readAsDataURL(file);
}

globalAdd.onclick=()=>addBlock(data.length);

editBtn.onclick=()=>{
    const p=prompt("输入密码");
    if(p===PASSWORD){
        editing=true;
        render();
    }
};

render();
