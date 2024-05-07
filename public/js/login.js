const toggleForms = () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  if (loginForm.classList.contains('hidden')) {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
  }
};

const erroCodeTranslation = {
  INVALID_PASSWORD: '填寫密碼不一致',
  INVALID_ARGC_EMPTY: '必填資料為空',
  INVALID_USERNAME: 'username已有人使用',
  INVALID_ARGC: '填寫資料有誤',
};

const loginSuccessMsg = () => Swal.fire({
  title: 'Login Successfully!',
  icon: 'success',
  button: false,
});

const failLoginMsg = (msg) => Swal.fire({
  title: 'Error!',
  text: msg,
  icon: 'error',
});
const login = async () => {
  const loginInfo = {
    username: document.getElementById('signinUsername').value,
    password: document.getElementById('signinPassword').value,
  };

  fetch('/member/login', {
    method: 'post',
    body: JSON.stringify(loginInfo),
    headers: { 'Content-Type': 'application/json' },
  }).then((response) => response.json()).then((response) => {
    if (response.errorCode) {
      const errorMsg = erroCodeTranslation[response.errorCode];
      failLoginMsg(errorMsg);
    } else {
      const { token } = response.value;
      if (token) {
        localStorage.setItem('access_token', token);
        loginSuccessMsg().then(() => {
          document.location.href = './index.html';
        });
      } else {
        console.error('Token not found in response');
        failLoginMsg('Login failed');
      }
    }
  })
    .catch((error) => {
      console.error(error);
      failLoginMsg('Login failed');
    });
};

const signup = async () => {
  const signupInfo = {
    username: document.getElementById('signupUsername').value,
    password: document.getElementById('signupPassword').value,
    confirmedPassword: document.getElementById('confirmedPassword').value,
  };

  fetch('/member/signup', {
    method: 'post',
    body: JSON.stringify(signupInfo),
    headers: { 'Content-Type': 'application/json' },
  }).then((response) => response.json()).then((response) => {
    if (response.errorCode) {
      const errorMsg = erroCodeTranslation[response.errorCode];
      failLoginMsg(errorMsg);
    } else {
      const { token } = response.value;
      if (token) {
        localStorage.setItem('access_token', token);
        loginSuccessMsg().then(() => {
          document.location.href = './index.html';
        });
      } else {
        console.error('Token not found in response');
        failLoginMsg('Login failed');
      }
    }
  })
    .catch((error) => {
      console.error(error);
      failLoginMsg('Login failed');
    });
};
