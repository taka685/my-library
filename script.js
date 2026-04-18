const GAS_URL = "https://script.google.com/macros/s/AKfycbxdC1hDGgnOg5aYceq9s19xwpXTq6OS_wK5GQsJi9HCId51Q6HYHlJKAzLzF-I2XBT8/exec";

// ページ読み込み時に実行
window.addEventListener('DOMContentLoaded', () => {
    fetchData();
    
    // 貸出メインのバーコード入力イベントを設定
    const barcodeInput = document.getElementById('barcode-input');
    if (barcodeInput) {
        barcodeInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const code = e.target.value;
                if (!code) return;
                
                // スキャン時に最新情報を再取得
                const books = await fetchData();
                const book = books.find(b => b[0] == code);
                
                if (book) {
                    showResult(book);
                } else {
                    alert("未登録の本です。管理画面から登録してください。");
                }
                e.target.value = "";
            }
        });
    }
});

// --- データを取得して画面を更新する ---
async function fetchData() {
    try {
        const response = await fetch(GAS_URL);
        const books = await response.json();
        updateInventoryUI(books);
        return books; 
    } catch (e) {
        console.error("データ取得失敗:", e);
        return [];
    }
}

// リスト表示を更新
function updateInventoryUI(books) {
    const stockList = document.getElementById('stock-list');
    const borrowedList = document.getElementById('borrowed-list');
    if (!stockList || !borrowedList) return;

    stockList.innerHTML = "";
    borrowedList.innerHTML = "";

    for (let i = 1; i < books.length; i++) {
        const [barcode, title, isBorrowed] = books[i];
        const li = document.createElement('li');
        li.innerText = "📙 " + title;

        if (isBorrowed === true || isBorrowed === "true") {
            borrowedList.appendChild(li);
        } else {
            stockList.appendChild(li);
        }
    }
}

// --- 画面切り替え ---
window.showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.style.display = 'block';
    
    // フォーカス処理
    if (pageId === 'main-page') {
        setTimeout(() => document.getElementById('barcode-input')?.focus(), 200);
    } else if (pageId === 'register-page') {
        setTimeout(() => document.getElementById('reg-barcode')?.focus(), 200);
    }
};

// --- 管理者ログイン ---
window.checkPassword = () => {
    const passInput = document.getElementById('admin-password');
    if (passInput.value === "178239") {
        showPage('register-page');
        passInput.value = "";
    } else {
        alert("パスワードが違います");
    }
};

// --- 本の登録 ---
window.registerBook = async () => {
    const barcodeField = document.getElementById('reg-barcode');
    const titleField = document.getElementById('reg-title');
    const regBtn = document.querySelector('#register-page .btn');

    if (!barcodeField.value || !titleField.value) {
        alert("バーコードとタイトルの両方を入力してください");
        return;
    }

    const data = { 
        action: "register", 
        barcode: barcodeField.value, 
        title: titleField.value 
    };
    
    // ボタンを無効化
    if (regBtn) {
        regBtn.disabled = true;
        regBtn.innerText = "登録中...";
    }

    try {
        await sendToGas(data);
        alert("「" + data.title + "」を登録しました！");
        
        barcodeField.value = '';
        titleField.value = '';
        barcodeField.focus();

        await fetchData(); // リスト更新

    } catch (e) {
        alert("エラーが発生しました");
    } finally {
        if (regBtn) {
            regBtn.disabled = false;
            regBtn.innerText = "スプレッドシートへ登録";
        }
    }
};

// --- 貸出・返却の切り替え ---
async function toggleBorrow(barcode, newStatus) {
    const data = { action: "update", barcode, isBorrowed: newStatus };
    document.getElementById('result-card').style.display = 'none';
    
    try {
        await sendToGas(data);
        await fetchData();
        alert(newStatus ? "貸し出しました" : "返却しました");
    } catch (e) {
        alert("通信エラーが発生しました");
    }
}

// GASにデータを送る (安定化版)
async function sendToGas(payload) {
    // no-corsモードでの送信
    await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain" }
    });
    // GASの処理完了を待つための待機時間
    return new Promise(resolve => setTimeout(resolve, 1000));
}

function showResult(book) {
    const [barcode, title, isBorrowed] = book;
    const card = document.getElementById('result-card');
    const resultTitle = document.getElementById('result-title');
    const resultStatus = document.getElementById('result-status');
    const btn = document.getElementById('action-btn');

    card.style.display = 'block';
    resultTitle.innerText = title;
    
    if (isBorrowed === true || isBorrowed === "true") {
        resultStatus.innerText = "状態：貸出中";
        btn.innerText = "返却する";
        btn.style.background = "#ffc107"; 
        btn.onclick = () => toggleBorrow(barcode, false);
    } else {
        resultStatus.innerText = "状態：在庫あり";
        btn.innerText = "借りる";
        btn.style.background = "#28a745"; 
        btn.onclick = () => toggleBorrow(barcode, true);
    }
}