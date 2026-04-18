const GAS_URL = "https://script.google.com/macros/s/AKfycbzzdplVtBLQ_IcwTigst4Z9v_GExztragZqPyaszci92qPaMz25t7sl7Xvzvr3hDUd5/exec";

// ページ読み込み時にデータを取得
window.onload = () => {
    fetchData();
};

// --- スプレッドシートからデータを取ってくる関数 ---
async function fetchData() {
    try {
        const response = await fetch(GAS_URL);
        const books = await response.json();
        updateInventoryUI(books);
    } catch (e) {
        console.error("データ取得失敗", e);
    }
}

// 在庫リストを表示する
function updateInventoryUI(books) {
    const stockList = document.getElementById('stock-list');
    const borrowedList = document.getElementById('borrowed-list');
    stockList.innerHTML = "";
    borrowedList.innerHTML = "";

    // 1行目はヘッダーなので i=1 から開始
    for (let i = 1; i < books.length; i++) {
        const [barcode, title, isBorrowed] = books[i];
        const li = document.createElement('li');
        li.innerText = title;

        if (isBorrowed === true || isBorrowed === "true") {
            borrowedList.appendChild(li);
        } else {
            stockList.appendChild(li);
        }
    }
}

// --- 画面切り替え ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
}

// --- 管理者ログイン ---
function checkPassword() {
    if (document.getElementById('admin-password').value === "178239") {
        showPage('register-page');
    } else {
        alert("パスワードが違います");
    }
}

// --- 本の登録 (GASへ送信) ---
async function registerBook() {
    const barcode = document.getElementById('reg-barcode').value;
    const title = document.getElementById('reg-title').value;
    if (!barcode || !title) return alert("全部入力してください");

    const data = { action: "register", barcode, title };
    await sendToGas(data);
    alert("登録しました！");
    location.reload(); 
}

// --- 貸出・返却の切り替え (GASへ送信) ---
async function toggleBorrow(barcode, newStatus) {
    const data = { action: "update", barcode, isBorrowed: newStatus };
    await sendToGas(data);
    alert(newStatus ? "貸し出しました" : "返却しました");
    location.reload();
}

// GASにデータを送る共通関数
async function sendToGas(payload) {
    await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

// バーコードスキャン入力 (貸出メイン)
document.getElementById('barcode-input').addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const code = e.target.value;
        const response = await fetch(GAS_URL);
        const books = await response.json();
        
        // スキャンした本を探す
        const book = books.find(b => b[0] == code);
        if (book) {
            showResult(book);
        } else {
            alert("未登録の本です");
        }
        e.target.value = "";
    }
});

function showResult(book) {
    const [barcode, title, isBorrowed] = book;
    const card = document.getElementById('result-card');
    card.style.display = 'block';
    document.getElementById('result-title').innerText = title;
    
    const btn = document.getElementById('action-btn');
    if (isBorrowed === true || isBorrowed === "true") {
        document.getElementById('result-status').innerText = "状態：貸出中";
        btn.innerText = "返却する";
        btn.onclick = () => toggleBorrow(barcode, false);
    } else {
        document.getElementById('result-status').innerText = "状態：在庫あり";
        btn.innerText = "借りる";
        btn.onclick = () => toggleBorrow(barcode, true);
    }
}