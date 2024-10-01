const erroCodeTranslation = {
  INVALID_AUTHORIZATION: '認證錯誤',
  INVALID_USER_TOKEN: '權限不足',
  INTERNAL_SERVER_ERROR: '系統錯誤',
  INVALID_ARGC_EMPTY: '資料為空',
  STOCK_NOT_FOUND: '無此資料',
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

const verifyToken = localStorage.getItem('access_token');
if (!verifyToken) {
  document.location.href = './login.html';
}

window.onload = async () => {
  document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('access_token');
    document.location.href = './login.html';
  });

  const socket = io({
    query: {
      token: verifyToken,
    },
  });

  socket.on('auth_error', (message) => {
    console.error('Authentication error:', message);
  });

  socket.on('todayPriceChanged', (_data) => {
    const targetElements = Array.from(document.querySelectorAll('.targetStocks'));
    const stockCodes = targetElements.map((element) => element.getAttribute('name'));

    socket.emit('todayPriceCode', stockCodes);
  });

  socket.on('todayPriceByCode', (data) => {
    const currentPriceElements = Array.from(document.querySelectorAll('.currentPrice'));
    const stockCodes = currentPriceElements.map((element) => element.getAttribute('name'));

    currentPriceElements.forEach((element, index) => {
      if (data[stockCodes[index]]) {
        element.innerHTML = data[stockCodes[index]];
      }
    });
  });

  const sendStockData = (stockCode, isMonitoring) => {
    const isAdding = !isMonitoring;
    const bodyData = {
      isAdding,
      stockCode,
    };

    fetch('/stock/userStocks', {
      method: 'post',
      headers: new Headers({
        Authorization: `Bearer ${verifyToken}`,
        'Content-type': 'application/json',
      }),
      body: JSON.stringify(bodyData),
    }).then((response) => response.json())
      .then((response) => {
        const { success, errorCode } = response;
        if (!success) return handleError(errorCode);
        document.location.href = './user.html';
      }).catch((error) => console.error(error.message));
  };

  fetch('/stock/list', {
    method: 'get',
    headers: new Headers({
      Authorization: `Bearer ${verifyToken}`,
      'Content-Type': 'application/json',
    }),
  }).then((response) => response.json())
    .then((response) => {
      const { success, errorCode } = response;
      if (!success) return handleError(errorCode);
      const stockUlistHtml = document.getElementById('stockList');
      const { stockList } = response.value;
      stockList.forEach((data) => {
        const { stockCode, name, isMonitoring } = data;
        const listItem = document.createElement('li');
        listItem.classList.add('col');

        const buttonHtml = isMonitoring
          ? '<button type="button" class="btn btn-outline-danger btn-sm addBtn">取消關注</button>'
          : '<button type="button" class="btn btn-outline-primary btn-sm addBtn">+ 關注</button>';
        listItem.innerHTML = `<div class="card">
                                          <div class="card-body">${name}</div>
                                          <div class="card-footer">
                                              ${buttonHtml}
                                          </div>
                                      </div>`;

        stockUlistHtml.appendChild(listItem);

        listItem.querySelector('.addBtn').addEventListener('click', () => {
          sendStockData(stockCode, isMonitoring);
        });
      });
    }).catch((error) => console.error(error.message));

  fetch('/stock/userStocks', {
    method: 'get',
    headers: new Headers({
      Authorization: `Bearer ${verifyToken}`,
      'Content-type': 'application/json',
    }),
  }).then((response) => response.json())
    .then((response) => {
      const { success, errorCode } = response;
      if (!success) return handleError(errorCode);

      const dataByStock = response.value;
      const noStockSign = '<h4>尚無關注的股票<h4>';
      if (dataByStock.length === 0) {
        document.getElementById('yourStocks').innerHTML = noStockSign;
      }

      const historyDataHtml = dataByStock.map((data) => {
        const { dataOfToday, historyData } = data;
        const tbodyData = historyData.map((d) => {
          const { date, openPrice, closePrice } = d;
          return ` <tr>
                        <td>${date.split(' ')[0]}</td>
                        <td>
                          ${openPrice}
                        </td>
                        <td>${closePrice}</td>
                    </tr>`;
        });

        return `<div>
                    <h4 class="targetStocks" name="${dataOfToday.stockCode}">
                      ${dataOfToday.name} ${dataOfToday.stockCode}
                    </h4>
                    <div>
                        <h5>今日股價</h5>
                        <table border="1">
                            <tr>
                                <th>Open Price</th>
                                <th>Current Price</th>
                            </tr>
                            <tr>
                                <td>${dataOfToday.openPrice}</td>
                                <td class="currentPrice" name="${dataOfToday.stockCode}">
                                  ${dataOfToday.price}
                                </td>
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
                            ${tbodyData.join('')}
                        </tbody>
                    </table>
                </div>
                <hr>`;
      });
      const historicalDataItem = document.createElement('div');
      historicalDataItem.innerHTML = historyDataHtml.join('');

      if (historyDataHtml.length > 0) {
        document.getElementById('yourStocks').appendChild(historicalDataItem);
      }
    });
};
