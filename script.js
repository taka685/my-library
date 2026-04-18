// データの初期化
let bookMaster = JSON.parse(localStorage.getItem('bookMaster') || '{}');
let borrowedBooks = JSON.parse(localStorage.getItem('borrowedBooks') || '{}');

// --- 画面切り替え機能 ---
function showPage(pageId) {
    // すべてのページを一旦非表示にする
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    // 指定したページだけ表示
    document.getElementById(pageId).style.display = 'block';
    
    // メインページに戻った時は入力欄にフォーカスを合わせる
    if(pageId === 'main-page') {
        setTimeout(() => document.getElementById('barcode-input').focus(), 100);
    }
}

// --- パスワードチェック ---
function checkPassword() {
    const pass = document.getElementById('admin-password').value;
    if (pass === "178239") {
        showPage('register-page');
        document.getElementById('admin-password').value = ""; // クリア
    } else {
        alert("パスワードが違います！");
    }
}

// --- 本の登録機能 ---
function registerBook() {
    const code = document.getElementById('reg-barcode').value;
    const title = document.getElementById('reg-title').value;
    if (!code || !title) {
        alert("両方入力してください");
        return;
    }
    bookMaster[code] = title;
    localStorage.setItem('bookMaster', JSON.stringify(bookMaster));
    alert("登録完了！");
    document.getElementById('reg-barcode').value = '';
    document.getElementById('reg-title').value = '';
}

// --- 貸出処理（前回とほぼ同じ） ---
const inputField = document.getElementById('barcode-input');
inputField.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const code = inputField.value;
        const title = bookMaster[code];
        if (!title) {
            alert("未登録の本です");
        } else {
            updateUI(code, title);
        }
        inputField.value = '';
    }
});

function updateUI(code, title) {
    document.getElementById('result-card').style.display = 'block';
    document.getElementById('book-title').innerText = title;
    const btn = document.getElementById('action-btn');
    const statusText = document.getElementById('status-text');

    if (borrowedBooks[code]) {
        statusText.innerText = "状態：貸出中";
        btn.innerText = "返却する";
        btn.onclick = () => { delete borrowedBooks[code]; save(); };
    } else {
        statusText.innerText = "状態：在庫あり";
        btn.innerText = "借りる";
        btn.onclick = () => { borrowedBooks[code] = title; save(); };
    }
}

function save() {
    localStorage.setItem('borrowedBooks', JSON.stringify(borrowedBooks));
    refreshList();
    document.getElementById('result-card').style.display = 'none';
}

function refreshList() {
    const list = document.getElementById('borrowed-list');
    list.innerHTML = "";
    for (let code in borrowedBooks) {
        const li = document.createElement('li');
        li.innerText = "📖 " + borrowedBooks[code];
        list.appendChild(li);
    }
}

refreshList();