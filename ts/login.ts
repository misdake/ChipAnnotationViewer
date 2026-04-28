function onToken(token: string) {
    localStorage.setItem('chipannotation-token', token);

    const messageText = document.getElementById('message-text');
    const loadingImage = document.getElementById('load-image');
    const countdownText = document.getElementById('countdown-text');
    if (!messageText || !loadingImage || !countdownText) return;

    messageText.innerText = 'Login successful';
    loadingImage.style.display = 'none';

    let countdown = 5;
    const count = () => {
        if (countdown === 0) {
            clearInterval(interval);
            const win = window.open('', '_self');
            if (win) win.close();
            return;
        }
        countdownText.style.display = 'block';
        countdownText.innerText = `Closing this page in ${countdown} seconds`;
        countdown--;
    };
    count();
    const interval = setInterval(count, 1000);
}

function onLoginFailed() {
    const messageText = document.getElementById('message-text');
    if (messageText) messageText.innerText = 'Login failed';
}

function runLoginFlow() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (!code) {
        window.location.href = 'index.html';
        return;
    }

    url.searchParams.delete('code');
    history.replaceState(null, '', url);

    const request = new XMLHttpRequest();
    request.onreadystatechange = () => {
        if (request.readyState === 4 && request.status === 200) {
            onToken(request.responseText);
        }
    };
    request.onerror = onLoginFailed;
    request.open('GET', `${__API_SERVER__}/login/github/callback?code=${code}`, true);
    request.send();
}

runLoginFlow();
