const erroCodeTranslation = {
  INTERNAL_SERVER_ERROR: '系統錯誤',
  INVALID_ARGC_EMPTY: '資料為空',
};

const failLoginMsg = (msg) => Swal.fire({
  title: 'Error!',
  text: erroCodeTranslation[msg],
  icon: 'error',
});

const handleError = async (errorCode) => {
  switch (errorCode) {
    case 'INVALID_USER_TOKEN':
      document.location.href = './login.html';
      break;
    case 'INVALID_AUTHORIZATION':
      document.location.href = './login.html';
      break;
    case 'INVALID_ARGC_EMPTY':
      failLoginMsg(errorCode);
      break;
    case 'INTERNAL_SERVER_ERROR':
      failLoginMsg(errorCode);
      break;
    default:
      failLoginMsg('INTERNAL_SERVER_ERROR');
  }
};

window.onload = async () => {
  const verifyToken = localStorage.getItem('access_token');
  if (verifyToken) {
    document.getElementById('login-btn').classList.add('hidden');
    document.getElementById('user-dropdown').classList.remove('hidden');
  }

  fetch('/member/userInfo', {
    method: 'get',
    headers: new Headers({
      Authorization: `Bearer ${verifyToken}`,
      'Content-type': 'application/json',
    }),
  })
    .then((response) => response.json())
    .then((response) => {
      const dropdownComponent = document.getElementById('navbarDropdown');
      dropdownComponent.innerHTML = response.value.username;
    });

  const searchButtons = document.querySelectorAll('.search-button');
  const searchStock = () => {
    const searchQuerysComponents = document.querySelectorAll('.search-box');
    const firstSearchQuery = searchQuerysComponents[0].value;
    const searchQuery = firstSearchQuery.length
      ? firstSearchQuery : searchQuerysComponents[1].value;
    fetch(`/stock/stock?query=${searchQuery}`)
      .then((response) => response.json())
      .then((response) => {
        const { success, errorCode } = response;
        if (!success) return handleError(errorCode);

        const { dataOfToday, dataOfHistory } = response.value;

        const historyDataHtml = dataOfHistory.map((data) => {
          const { date, openPrice, closePrice } = data;
          return ` <tr>
                    <td>${date.split(' ')[0]}</td>
                    <td>${openPrice}</td>
                    <td>${closePrice}</td>
                </tr>`;
        });

        const searchBodyComponent = document.getElementById('search-body');
        if (!searchBodyComponent.classList.contains('hidden')) {
          searchBodyComponent.classList.add('hidden');
        }

        const stockInfoComponent = document.getElementById('stockInfo');
        if (stockInfoComponent.classList.contains('hidden')) {
          stockInfoComponent.classList.remove('hidden');
        }

        stockInfoComponent.innerHTML = `<div>
            <div class="container-fluid justify-content-start">
                <div class="row justify-content-start">
                    <div class="col-4">
                        <h4>${dataOfToday.name} ${dataOfToday.stockCode}</h4>
                    </div>
                    <div class="col-4">
                        <button type="button" class="btn btn-outline-primary">+ 關注</button>
                    </div>
                </div>         
            </div> 
            <div>
                <h5>今日股價</h5>
                <table border="1">
                    <tr>
                        <th>Open Price</th>
                        <th>Current Price</th>
                    </tr>
                    <tr>
                        <td>${dataOfToday.openPrice}</td>
                        <td>${dataOfToday.price}</td>
                    </tr>
                </table>
            </div>
            <table border="1">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Open Price</th>
                        <th>Close Price</th>
                    </tr>
                </thead>
                <tbody id="">
                    ${historyDataHtml.join('')}
                </tbody>
            </table>
        </div>
        <hr>`;
      }).catch((error) => console.error(error.message));
  };
  searchButtons.forEach((searchButton) => {
    searchButton.addEventListener('click', () => {
      searchStock();
    });
  });
};
