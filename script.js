// Блок управления данными
const DataStore = (() => {
  let cars = [];
  let activeTab = 'add'; // По умолчанию активна вкладка "Добавить автомобиль/работу"

  const saveToLocalStorage = () => {
    localStorage.setItem('cars', JSON.stringify(cars));
    localStorage.setItem('activeTab', activeTab);
  };

  const loadFromLocalStorage = () => {
    cars = JSON.parse(localStorage.getItem('cars')) || [];
    activeTab = localStorage.getItem('activeTab') || 'add';
  };

  return {
    getCars: () => cars,
    setCars: (newCars) => {
      cars = newCars;
      saveToLocalStorage();
    },
    getActiveTab: () => activeTab,
    setActiveTab: (newTab) => {
      activeTab = newTab;
      saveToLocalStorage();
    },
    loadState: loadFromLocalStorage,
  };
})();

// Блок отображения данных
const Renderer = (() => {
  const renderCarList = (filter = '') => {
    const carList = document.querySelector('.crm-system__table-body');
    carList.innerHTML = '';

    const filteredCars = DataStore.getCars()
      .filter(car => car.model.toLowerCase().includes(filter.toLowerCase()))
      .reverse();

    filteredCars.forEach((car, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <th scope="row">${index + 1}</th>
        <td>${car.model}</td>
        <td>${car.workTypes.join(', ')}</td>
        <td>
          <button class="btn btn-sm btn-primary crm-system__select-btn" onclick="EventHandler.selectCar(${DataStore.getCars().indexOf(car)})">Выбрать</button>
        </td>
      `;
      carList.appendChild(row);
    });
  };

  const setCurrentCarInfo = (car) => {
    const currentCarInfo = document.getElementById('current-car-info');
    if (car) {
      currentCarInfo.textContent = `Модель: ${car.model}, Виды работ: ${car.workTypes.join(', ')}`;
    } else {
      currentCarInfo.textContent = 'Выберите автомобиль из списка.';
    }
  };

  return {
    renderCarList,
    setCurrentCarInfo,
  };
})();

// Блок обработки событий
const EventHandler = (() => {
  const handleAddFormSubmit = (e) => {
    e.preventDefault();

    const carModel = document.getElementById('car-model').value.trim();
    const workFields = Array.from(document.querySelectorAll('.work-field'))
      .map(input => input.value.trim())
      .filter(value => value !== ''); // Удаляем пустые значения

    if (carModel && workFields.length > 0) {
      const newCar = { model: carModel, workTypes: workFields }; // Создаем новый автомобиль
      const updatedCars = [...DataStore.getCars(), newCar];
      DataStore.setCars(updatedCars); // Обновляем список автомобилей
      Renderer.renderCarList(); // Перерисовываем список
      document.getElementById('add-form').reset(); // Очищаем форму
      clearWorkFields(); // Очищаем поля видов работ
      TabManager.activateTab('list'); // Переходим на вкладку "Список автомобилей"
    } else {
      alert('Заполните все поля!');
    }
  };

  const selectCar = (index) => {
    const selectedCar = DataStore.getCars()[index];
    Renderer.setCurrentCarInfo(selectedCar); // Отображаем информацию о выбранном автомобиле
    TabManager.activateTab('current'); // Переходим на вкладку "Текущий автомобиль"
  };

  const addWorkField = () => {
    const workFieldsContainer = document.getElementById('work-fields');
    const newField = document.createElement('div');
    newField.classList.add('input-group', 'mb-2');
    newField.innerHTML = `
      <input type="text" class="form-control crm-system__input work-field" placeholder="Введите вид работы">
      <button class="btn btn-danger crm-system__remove-btn" onclick="removeWorkField(this)">Удалить</button>
    `;
    workFieldsContainer.appendChild(newField);
  };

  const removeWorkField = (button) => {
    button.closest('.input-group').remove(); // Удаляем поле
  };

  const clearWorkFields = () => {
    const workFieldsContainer = document.getElementById('work-fields');
    workFieldsContainer.innerHTML = ''; // Очищаем контейнер
    addWorkField(); // Добавляем одно поле по умолчанию
  };

  return {
    handleAddFormSubmit,
    selectCar,
    addWorkField,
    removeWorkField,
    clearWorkFields,
  };
})();

// Блок активации вкладок
const TabManager = (() => {
  const activateTab = (tabId) => {
    const tabs = document.querySelectorAll('.crm-system__tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));

    const activeTabElement = document.getElementById(`${tabId}-tab`);
    if (activeTabElement) {
      activeTabElement.classList.add('active');
      const tab = new bootstrap.Tab(activeTabElement);
      tab.show();
    }

    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => pane.classList.remove('show', 'active'));
    const activePane = document.querySelector(`#${tabId}`);
    if (activePane) {
      activePane.classList.add('show', 'active');
    }

    DataStore.setActiveTab(tabId); // Сохраняем активную вкладку
  };

  const restoreActiveTab = () => {
    const savedTab = DataStore.getActiveTab();
    activateTab(savedTab); // Активируем сохраненную вкладку
  };

  const addTabClickHandlers = () => {
    const tabs = document.querySelectorAll('.crm-system__tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('id').split('-')[0]; // Получаем ID вкладки
        activateTab(tabId);
      });
    });
  };

  return {
    activateTab,
    restoreActiveTab,
    addTabClickHandlers,
  };
})();

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  DataStore.loadState(); // Загружаем состояние из localStorage
  Renderer.renderCarList(); // Отображаем список автомобилей
  TabManager.restoreActiveTab(); // Восстанавливаем активную вкладку

  // Добавляем обработчики кликов для вкладок
  TabManager.addTabClickHandlers();

  // Обработка форм
  document.getElementById('add-form').addEventListener('submit', EventHandler.handleAddFormSubmit);

  // Обработка фильтрации
  document.getElementById('search-input').addEventListener('input', filterCars);

  // Добавляем одно поле для видов работ по умолчанию
  EventHandler.addWorkField();
});

// Фильтрация автомобилей
function filterCars() {
  const filter = document.getElementById('search-input').value;
  Renderer.renderCarList(filter);
}

// Экспорт функций для использования в HTML
window.selectCar = EventHandler.selectCar;
window.filterCars = filterCars;
window.addWorkField = EventHandler.addWorkField;
window.removeWorkField = EventHandler.removeWorkField;
window.activateTab = TabManager.activateTab;
