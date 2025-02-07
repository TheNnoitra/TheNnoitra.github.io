let tg = window.Telegram.WebApp;

// Проверяем, что мы запущены как Web App
if (!!tg?.ready) {
  const userInfo = document.getElementById('user-info');
  const sendBtn = document.getElementById('send-data-btn');

  // Получаем информацию о пользователе
  const userFirstName = tg.initDataUnsafe.user.first_name;
  const userLastName = tg.initDataUnsafe.user.last_name;

  userInfo.textContent = `Привет, ${userFirstName} ${userLastName}!`;

  // Обработка нажатия кнопки
  sendBtn.addEventListener('click', () => {
    const data = 'Данные от Web App';
    tg.sendData(data); // Отправляем данные обратно в бота
    tg.close(); // Закрываем Web App
  });
}
