// Блок управления данными
const DataStore = (() => {
  let cars = [];
  let activeTab = 'add'; // По умолчанию активна вкладка "Добавить автомобиль/работу"
  let lastSelectedCarIndex = null; // Индекс последнего выбранного автомобиля

  const saveToLocalStorage = () => {
    localStorage.setItem('cars', JSON.stringify(cars));
    localStorage.setItem('activeTab', activeTab);
    localStorage.setItem('lastSelectedCarIndex', lastSelectedCarIndex);
  };

  const loadFromLocalStorage = () => {
    cars = JSON.parse(localStorage.getItem('cars')) || [];
    activeTab = localStorage.getItem('activeTab') || 'add';
    lastSelectedCarIndex = localStorage.getItem('lastSelectedCarIndex');
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
    getLastSelectedCarIndex: () => lastSelectedCarIndex,
    setLastSelectedCarIndex: (index) => {
      lastSelectedCarIndex = index;
      saveToLocalStorage();
    },
    loadState: loadFromLocalStorage,
  };
})();

// Блок отображения данных
const Renderer = (() => {
  const renderCarList = (filter = '') => {
    const carCardsContainer = document.getElementById('car-cards');
    carCardsContainer.innerHTML = '';

    const filteredCars = DataStore.getCars()
      .filter(car => car.model.toLowerCase().includes(filter.toLowerCase()))
      .reverse();

    filteredCars.forEach((car, index) => {
      const card = document.createElement('div');
      card.classList.add('col', 'crm-system__card-col');
      card.innerHTML = `
        <div class="card crm-system__card">
          <h5 class="card-title crm-system__card-title">${car.model}</h5>
          <p class="card-text crm-system__card-subtitle">Статус: <span class="crm-system__status-${car.status}">${getStatusLabel(car.status)}</span></p>
          <button class="btn crm-system__card-btn" onclick="EventHandler.selectCar(${index})">Выбрать</button>
        </div>
      `;
      carCardsContainer.appendChild(card);
    });
  };

  const setCurrentCarInfo = (car) => {
    const currentCarModel = document.getElementById('current-car-model');
    const currentCarStatus = document.getElementById('current-car-status');
    const startWorkBtn = document.getElementById('start-work-btn');
    const workList = document.getElementById('current-car-works');

    if (car) {
      currentCarModel.textContent = `Модель: ${car.model}`;
      currentCarStatus.textContent = `Статус: ${getStatusLabel(car.status)}`;
      currentCarStatus.className = `crm-system__current-info crm-system__status-${car.status}`;

      // Отображение видов работ
      workList.innerHTML = '';
      car.workTypes.forEach(work => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', `crm-system__work-item`, `crm-system__status-${work.status}`);
        listItem.textContent = work.name;
        listItem.onclick = () => toggleWorkStatus(car, work.name);
        workList.appendChild(listItem);
      });

      // Показать/скрыть кнопку "В работу"
      startWorkBtn.style.display = car.status === 'new' ? 'block' : 'none';
    } else {
      currentCarModel.textContent = 'Модель: ';
      currentCarStatus.textContent = 'Статус: Выберите автомобиль из списка.';
      workList.innerHTML = '';
      startWorkBtn.style.display = 'none';
    }
  };

  const updateCarStatus = (car) => {
    const allDone = car.workTypes.every(work => work.status === 'done');
    car.status = allDone ? 'completed' : car.status === 'new' ? 'in-progress' : car.status;
    DataStore.setCars(DataStore.getCars());
    Renderer.renderCarList();
  };

  return {
    renderCarList,
    setCurrentCarInfo,
    updateCarStatus,
  };
})();

// Блок обработки событий
const EventHandler = (() => {
  const handleAddFormSubmit = (e) => {
    e.preventDefault();

    const carModel = document.getElementById('car-model').value.trim();
    const workFields = Array.from(document.querySelectorAll('.work-field'))
      .map(input => input.value.trim())
      .filter(value => value !== '');

    if (carModel && workFields.length > 0) {
      const newCar = {
        model: carModel,
        status: 'new',
        workTypes: workFields.map(work => ({ name: work, status: 'work' })),
      };
      const updatedCars = [...DataStore.getCars(), newCar];
      DataStore.setCars(updatedCars);
      Renderer.renderCarList();
      document.getElementById('add-form').reset();
      clearWorkFields();
      TabManager.activateTab('list');
    } else {
      alert('Заполните все поля!');
    }
  };

  const selectCar = (index) => {
    const selectedCar = DataStore.getCars()[index];
    Renderer.setCurrentCarInfo(selectedCar);
    TabManager.activateTab('current');
    DataStore.setLastSelectedCarIndex(index); // Сохраняем индекс выбранного автомобиля
  };

  const toggleWorkStatus = (car, workName) => {
    const updatedCars = DataStore.getCars().map(c => {
      if (c === car) {
        return {
          ...c,
          workTypes: c.workTypes.map(work =>
            work.name === workName ? { ...work, status: work.status === 'work' ? 'done' : 'work' } : work
          ),
        };
      }
      return c;
    });
    DataStore.setCars(updatedCars);
    Renderer.updateCarStatus(updatedCars.find(c => c === car)); // Обновляем статус автомобиля
    Renderer.setCurrentCarInfo(car); // Обновляем информацию о текущем автомобиле
  };

  const startWork = () => {
    const selectedCar = DataStore.getCars().find(car => car.status === 'new');
    if (selectedCar) {
      selectedCar.status = 'in-progress';
      DataStore.setCars(DataStore.getCars());
      Renderer.updateCarStatus(selectedCar);
      Renderer.setCurrentCarInfo(selectedCar);
    }
  };

  const addWorkField = () => {
    const workFieldsContainer = document.getElementById('work-fields');
    if (!workFieldsContainer) return;

    const newField = document.createElement('div');
    newField.classList.add('input-group', 'mb-2'); // Добавляем классы Bootstrap
    newField.innerHTML = `
      <input type="text" class="form-control crm-system__input work-field" placeholder="Введите вид работы">
      <button class="btn btn-danger crm-system__remove-btn" onclick="EventHandler.removeWorkField(this)">Удалить</button>
    `;
    workFieldsContainer.appendChild(newField); // Добавляем новое поле в контейнер
  };

  const removeWorkField = (button) => {
    const fieldGroup = button.closest('.input-group');
    if (fieldGroup) {
      fieldGroup.remove(); // Удаляем группу полей
    }
  };

  const clearWorkFields = () => {
    const workFieldsContainer = document.getElementById('work-fields');
    if (workFieldsContainer) {
      workFieldsContainer.innerHTML = ''; // Очищаем контейнер
      addWorkField(); // Добавляем одно поле по умолчанию
    }
  };

  return {
    handleAddFormSubmit,
    selectCar,
    toggleWorkStatus,
    startWork,
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

    DataStore.setActiveTab(tabId);
  };

  const restoreActiveTab = () => {
    const savedTab = DataStore.getActiveTab();
    activateTab(savedTab);

    // Восстанавливаем последний выбранный автомобиль
    const lastSelectedCarIndex = DataStore.getLastSelectedCarIndex();
    if (lastSelectedCarIndex !== null) {
      const lastSelectedCar = DataStore.getCars()[lastSelectedCarIndex];
      if (lastSelectedCar) {
        Renderer.setCurrentCarInfo(lastSelectedCar);
        activateTab('current');
      }
    }
  };

  const addTabClickHandlers = () => {
    const tabs = document.querySelectorAll('.crm-system__tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('id').split('-')[0];
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
  DataStore.loadState();
  Renderer.renderCarList();
  TabManager.restoreActiveTab();
  TabManager.addTabClickHandlers();

  // Добавляем одно поле для видов работ по умолчанию
  EventHandler.addWorkField();

  document.getElementById('add-form').addEventListener('submit', EventHandler.handleAddFormSubmit);
  document.getElementById('search-input').addEventListener('input', filterCars);
});

// Фильтрация автомобилей
function filterCars() {
  const filter = document.getElementById('search-input').value;
  Renderer.renderCarList(filter);
}

// Получение текстового представления статуса
function getStatusLabel(status) {
  const labels = {
    new: 'Новый',
    in_progress: 'В работе',
    completed: 'Готово',
  };
  return labels[status] || 'Неизвестно';
}
