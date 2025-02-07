// Массив для хранения данных об автомобилях
let cars = [];

// Функция для отображения списка автомобилей
function renderCarList() {
  const carList = document.getElementById('car-list');
  carList.innerHTML = '';

  cars.forEach((car, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <th scope="row">${index + 1}</th>
      <td>${car.model}</td>
      <td>${car.workDescription}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="selectCar(${index})">Выбрать</button>
      </td>
    `;
    carList.appendChild(row);
  });
}

// Функция для выбора текущего автомобиля
function selectCar(index) {
  const currentCarInfo = document.getElementById('current-car-info');
  const selectedCar = cars[index];
  currentCarInfo.textContent = `Модель: ${selectedCar.model}, Работа: ${selectedCar.workDescription}`;
  const tab = new bootstrap.Tab(document.querySelector('#current-tab'));
  tab.show();
}

// Обработка формы "Добавить автомобиль/работу"
document.getElementById('add-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const carModel = document.getElementById('car-model').value;
  const workDescription = document.getElementById('work-description').value;

  if (carModel && workDescription) {
    cars.push({ model: carModel, workDescription });
    renderCarList();
    document.getElementById('add-form').reset();
  } else {
    alert('Заполните все поля!');
  }
});

// Инициализация приложения
renderCarList();
