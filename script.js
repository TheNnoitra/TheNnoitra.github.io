// Проверяем, что мы запущены как Web App
if (Telegram.WebApp.ready) {
  const userInfo = document.getElementById('user-info');
  const sendBtn = document.getElementById('send-data-btn');

  // Получаем информацию о пользователе
  const userFirstName = Telegram.WebApp.initDataUnsafe.user.first_name;
  const userLastName = Telegram.WebApp.initDataUnsafe.user.last_name;

  userInfo.textContent = `Привет, ${userFirstName} ${userLastName}!`;

  // Обработка нажатия кнопки
  sendBtn.addEventListener('click', () => {
    const data = 'Данные от Web App';
    Telegram.WebApp.sendData(data); // Отправляем данные обратно в бота
    Telegram.WebApp.close(); // Закрываем Web App
  });
}
