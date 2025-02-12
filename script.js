const tg = window.Telegram.WebApp;

// Блок управления данными
const DataStore = (() => {
  let cars = [];
  let activeTab = 'add'; // По умолчанию активна вкладка "Добавить автомобиль/работу"
  let lastSelectedCarUID = null;
  let carBeingEdited = null; // Автомобиль, который редактируется

  const saveToLocalStorage = () => {
    localStorage.setItem('cars', JSON.stringify(cars));
    localStorage.setItem('activeTab', activeTab);
    localStorage.setItem('lastSelectedCarUID', lastSelectedCarUID);
  };

  const loadFromLocalStorage = () => {
    cars = JSON.parse(localStorage.getItem('cars')) || [];
    activeTab = localStorage.getItem('activeTab') || 'add';
    lastSelectedCarUID = localStorage.getItem('lastSelectedCarUID');
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
    getLastSelectedCarUID: () => lastSelectedCarUID,
    setLastSelectedCarUID: (uid) => {
      lastSelectedCarUID = uid;
      saveToLocalStorage();
    },
    getCarBeingEdited: () => carBeingEdited,
    setCarBeingEdited: (car) => {
      carBeingEdited = car;
      saveToLocalStorage();
    },
    loadState: loadFromLocalStorage,
  };
})();

// Блок Telegram Web App интеграции
const TelegramIntegration = (() => {
  const tg = window.Telegram.WebApp;

  // Адаптация под Telegram Web App
  if (tg) {
    tg.ready();
    // Скрыть кнопку Telegram при фокусировке на input
    const inputFields = document.querySelectorAll('.crm-system__input');
    inputFields.forEach(input => {
      input.addEventListener('focus', () => {
        tg.MainButton.hide(); // Скрываем кнопку Telegram
      });

      input.addEventListener('blur', () => {
        if (!tg.MainButton.isVisible) {
          tg.MainButton.show(); // Показываем кнопку Telegram после завершения ввода
        }
      });
    });

    // Обработка нажатия на кнопку Telegram
    tg.onEvent('main_button_click', () => {
      const currentTab = DataStore.getActiveTab();
      if (currentTab === 'add') {
        document.getElementById('add-form').requestSubmit(); // Отправляем форму добавления автомобиля
      } else if (currentTab === 'edit') {
        EventHandler.saveEditedCar(); // Сохраняем изменения при редактировании
      }
    });

    // Адаптация высоты страницы
    tg.expand(); // Расширяем Web App на всю доступную высоту
    tg.MainButton.setText('Готово'); // Устанавливаем текст кнопки Telegram
    // tg.MainButton.setColor('#6200ea'); // Устанавливаем цвет кнопки Telegram

    // При появлении клавиатуры Telegram
    tg.onEvent('keyboard_close', () => {
      tg.MainButton.show(); // Показываем кнопку Telegram после закрытия клавиатуры
    });
  }

  return {
    isTgWebApp: () => !!tg,
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

    filteredCars.forEach(car => {
      const card = document.createElement('div');
      card.classList.add('col', 'crm-system__card-col');
      card.innerHTML = `
        <div class="card crm-system__card position-relative">
          <h5 class="card-title crm-system__card-title">${car.model}</h5>
          <p class="card-text crm-system__card-subtitle d-flex justify-content-between align-items-center">
            Статус: <span class="crm-system__status-${car.status}">${getStatusLabel(car.status)}</span>
            <span class="crm-system__card-status-updated">${formatDate(car.statusUpdated)}</span>
          </p>
          <button class="btn crm-system__card-btn" onclick="EventHandler.selectCar('${car.createdAt}')">Выбрать</button>
          <button class="btn btn-warning crm-system__card-btn" onclick="EventHandler.prepareEditCar('${car.createdAt}')">Редактировать</button>
          <p class="crm-system__card-date">${formatDate(car.createdAt)}</p>
        </div>
      `;
      carCardsContainer.appendChild(card);
    });
  };

  const setCurrentCarInfo = (car) => {
    const currentCarModel = document.getElementById('current-car-model');
    const currentCarCreatedAt = document.getElementById('current-car-created-at');
    const currentCarStatus = document.getElementById('current-car-status');
    const currentCarStatusUpdatedAt = document.getElementById('current-car-status-updated-at');
    const currentCarYear = document.getElementById('current-car-year');
    const currentCarVin = document.getElementById('current-car-vin');
    const currentCarMileage = document.getElementById('current-car-mileage');
    const currentOwnerName = document.getElementById('current-owner-name');
    const currentOwnerPhone = document.getElementById('current-owner-phone');
    const startWorkBtn = document.getElementById('start-work-btn');
    const editCarBtn = document.getElementById('edit-car-btn');
    const workList = document.getElementById('current-car-works');

    if (car) {
      currentCarModel.textContent = `Модель: ${car.model}`;
      currentCarCreatedAt.textContent = `Дата создания: ${formatDate(car.createdAt)}`;
      currentCarStatus.textContent = `Статус: ${getStatusLabel(car.status)}`;
      currentCarStatus.className = `crm-system__current-info crm-system__status-${car.status}`;
      currentCarStatusUpdatedAt.textContent = `Дата обновления статуса: ${formatDate(car.statusUpdated)}`;
      currentCarYear.textContent = car.year || 'Не указано';
      currentCarVin.textContent = car.vin || 'Не указано';
      currentCarMileage.textContent = `${car.mileage || 0} км`;
      currentOwnerName.textContent = car.owner?.name || 'Не указано';
      currentOwnerPhone.textContent = car.owner?.phone || 'Не указано';

      workList.innerHTML = '';
      car.workTypes.forEach(work => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', `crm-system__work-item`, `crm-system__status-${work.status}`);
        listItem.textContent = work.name;
        listItem.onclick = () => toggleWorkStatus(car, work.name);
        workList.appendChild(listItem);
      });

      startWorkBtn.style.display = car.status === 'new' ? 'block' : 'none';
      editCarBtn.style.display = 'block';
    } else {
      currentCarModel.textContent = 'Модель: ';
      currentCarCreatedAt.textContent = 'Дата создания:';
      currentCarStatus.textContent = 'Статус: Выберите автомобиль из списка.';
      currentCarStatusUpdatedAt.textContent = 'Дата обновления статуса:';
      currentCarYear.textContent = 'Год выпуска:';
      currentCarVin.textContent = 'VIN-номер:';
      currentCarMileage.textContent = 'Пробег:';
      currentOwnerName.textContent = 'Владелец:';
      currentOwnerPhone.textContent = 'Телефон:';
      workList.innerHTML = '';
      startWorkBtn.style.display = 'none';
      editCarBtn.style.display = 'none';
    }
  };

  const updateCarStatus = (car) => {
    const allDone = car.workTypes.every(work => work.status === 'done');
    const newStatus = allDone ? 'completed' : car.status === 'new' ? 'in-progress' : car.status;

    if (newStatus !== car.status) {
      car.status = newStatus;
      car.statusUpdated = Date.now(); // Обновляем дату изменения статуса
    }

    DataStore.setCars(DataStore.getCars());
    Renderer.renderCarList();

    // Если автомобиль выбран, обновляем информацию на вкладке "Текущий автомобиль"
    const lastSelectedCarUID = DataStore.getLastSelectedCarUID();
    if (lastSelectedCarUID && car.createdAt === parseInt(lastSelectedCarUID)) {
      Renderer.setCurrentCarInfo(car);
    }
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
    const carYear = document.getElementById('car-year').value.trim() || null;
    const carVin = document.getElementById('car-vin').value.trim() || null;
    const carMileage = document.getElementById('car-mileage').value.trim() || 0;
    const ownerName = document.getElementById('owner-name').value.trim() || null;
    const ownerPhone = document.getElementById('owner-phone').value.trim() || null;
    const workFields = Array.from(document.querySelectorAll('.work-field'))
      .map(input => input.value.trim())
      .filter(value => value !== '');

    if (carModel && workFields.length > 0) {
      const newCar = {
        model: carModel,
        year: carYear,
        vin: carVin,
        mileage: parseInt(carMileage),
        owner: {
          name: ownerName,
          phone: ownerPhone,
        },
        status: 'new',
        createdAt: Date.now(),
        statusUpdated: Date.now(),
        workTypes: workFields.map(work => ({ name: work, status: 'work' })),
      };
      const updatedCars = [...DataStore.getCars(), newCar];
      DataStore.setCars(updatedCars);
      Renderer.renderCarList();
      document.getElementById('add-form').reset();
      clearWorkFields();
      TabManager.activateTab('list');

      // Если используется Telegram Web App, отправляем данные
      if (TelegramIntegration.isTgWebApp()) {
        tg.sendData(JSON.stringify(newCar)); // Отправляем новый автомобиль в бот
        tg.close(); // Закрываем Web App
      }
    } else {
      alert('Заполните все обязательные поля!');
    }
  };

  const selectCar = (uid) => {
    const selectedCar = DataStore.getCars().find(car => car.createdAt === parseInt(uid));
    if (selectedCar) {
      Renderer.setCurrentCarInfo(selectedCar);
      TabManager.activateTab('current');
      DataStore.setLastSelectedCarUID(uid);
    } else {
      alert('Автомобиль не найден!');
    }
  };

  const toggleWorkStatus = (car, workName) => {
    const updatedCars = DataStore.getCars().map(c => {
      if (c.createdAt === car.createdAt) {
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

    // Обновляем статус автомобиля
    const updatedCar = updatedCars.find(c => c.createdAt === car.createdAt);
    Renderer.updateCarStatus(updatedCar);
  };

  const startWork = () => {
    const selectedCar = DataStore.getCars().find(car => car.status === 'new' && car.createdAt === parseInt(DataStore.getLastSelectedCarUID()));
    if (selectedCar) {
      selectedCar.status = 'in-progress';
      selectedCar.statusUpdated = Date.now(); // Обновляем дату изменения статуса
      DataStore.setCars(DataStore.getCars());

      // Обновляем статус автомобиля
      Renderer.updateCarStatus(selectedCar);
      Renderer.setCurrentCarInfo(selectedCar);
    }
  };

  const addWorkField = () => {
    const workFieldsContainer = document.getElementById('work-fields');
    const newField = document.createElement('div');
    newField.classList.add('input-group', 'mb-2');
    newField.innerHTML = `
      <input type="text" class="form-control crm-system__input work-field" placeholder="Введите вид работы">
      <button class="btn btn-danger crm-system__remove-btn" onclick="EventHandler.removeWorkField(this)">Удалить</button>
    `;
    workFieldsContainer.appendChild(newField);
  };

  const removeWorkField = (button) => {
    button.closest('.input-group').remove();
  };

  const clearWorkFields = (containerId) => {
    const workFieldsContainer = document.getElementById(containerId);
    workFieldsContainer.innerHTML = '';
    addWorkField();
  };

  const prepareEditCar = (uid) => {
    const car = DataStore.getCars().find(car => car.createdAt === parseInt(uid));
    if (car) {
      DataStore.setCarBeingEdited(car);
      populateEditForm(car);
      TabManager.activateTab('edit');
    } else {
      alert('Автомобиль не найден!');
    }
  };

  const populateEditForm = (car) => {
    const editCarModel = document.getElementById('edit-car-model');
    const editCarYear = document.getElementById('edit-car-year');
    const editCarVin = document.getElementById('edit-car-vin');
    const editCarMileage = document.getElementById('edit-car-mileage');
    const editOwnerName = document.getElementById('edit-owner-name');
    const editOwnerPhone = document.getElementById('edit-owner-phone');
    const editWorkFieldsContainer = document.getElementById('edit-work-fields');

    editCarModel.value = car.model;
    editCarYear.value = car.year || '';
    editCarVin.value = car.vin || '';
    editCarMileage.value = car.mileage || '';
    editOwnerName.value = car.owner?.name || '';
    editOwnerPhone.value = car.owner?.phone || '';

    editWorkFieldsContainer.innerHTML = '';
    car.workTypes.forEach(work => {
      const fieldGroup = document.createElement('div');
      fieldGroup.classList.add('input-group', 'mb-2');
      fieldGroup.innerHTML = `
        <input type="text" class="form-control crm-system__input edit-work-field" value="${work.name}">
        <button class="btn btn-danger crm-system__remove-btn" onclick="EventHandler.removeEditWorkField(this)">Удалить</button>
      `;
      editWorkFieldsContainer.appendChild(fieldGroup);
    });
  };

  const addEditWorkField = () => {
    const editWorkFieldsContainer = document.getElementById('edit-work-fields');
    const newField = document.createElement('div');
    newField.classList.add('input-group', 'mb-2');
    newField.innerHTML = `
      <input type="text" class="form-control crm-system__input edit-work-field" placeholder="Введите вид работы">
      <button class="btn btn-danger crm-system__remove-btn" onclick="EventHandler.removeEditWorkField(this)">Удалить</button>
    `;
    editWorkFieldsContainer.appendChild(newField);
  };

  const removeEditWorkField = (button) => {
    button.closest('.input-group').remove();
  };

  const saveEditedCar = () => {
    const carBeingEdited = DataStore.getCarBeingEdited();
    if (!carBeingEdited) return;

    const editedCarModel = document.getElementById('edit-car-model').value.trim();
    const editedCarYear = document.getElementById('edit-car-year').value.trim() || null;
    const editedCarVin = document.getElementById('edit-car-vin').value.trim() || null;
    const editedCarMileage = document.getElementById('edit-car-mileage').value.trim() || 0;
    const editedOwnerName = document.getElementById('edit-owner-name').value.trim() || null;
    const editedOwnerPhone = document.getElementById('edit-owner-phone').value.trim() || null;
    const editedWorkFields = Array.from(document.querySelectorAll('.edit-work-field'))
      .map(input => input.value.trim())
      .filter(value => value !== '');

    if (editedCarModel && editedWorkFields.length > 0) {
      const updatedCars = DataStore.getCars().map(car => {
        if (car.createdAt === carBeingEdited.createdAt) {
          return {
            ...car,
            model: editedCarModel,
            year: editedCarYear,
            vin: editedCarVin,
            mileage: parseInt(editedCarMileage),
            owner: {
              name: editedOwnerName,
              phone: editedOwnerPhone,
            },
            workTypes: editedWorkFields.map(work => ({ name: work, status: 'work' })),
          };
        }
        return car;
      });

      DataStore.setCars(updatedCars);
      DataStore.setCarBeingEdited(null); // Очищаем автомобиль для редактирования
      Renderer.renderCarList();
      const lastSelectedCarUID = DataStore.getLastSelectedCarUID();
      if (lastSelectedCarUID) {
        const selectedCar = DataStore.getCars().find(car => car.createdAt === parseInt(lastSelectedCarUID));
        Renderer.setCurrentCarInfo(selectedCar);
        TabManager.activateTab('current');
      }
    } else {
      alert('Заполните все обязательные поля!');
    }
  };

  const cancelEdit = () => {
    DataStore.setCarBeingEdited(null); // Очищаем автомобиль для редактирования
    const lastSelectedCarUID = DataStore.getLastSelectedCarUID();
    if (lastSelectedCarUID) {
      TabManager.activateTab('current');
    } else {
      TabManager.activateTab('list');
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
    prepareEditCar,
    addEditWorkField,
    removeEditWorkField,
    saveEditedCar,
    cancelEdit,
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

    // Если последняя вкладка была "Текущий автомобиль", восстанавливаем выбранный автомобиль
    if (savedTab === 'current') {
      const lastSelectedCarUID = DataStore.getLastSelectedCarUID();
      if (lastSelectedCarUID) {
        const lastSelectedCar = DataStore.getCars().find(car => car.createdAt === parseInt(lastSelectedCarUID));
        if (lastSelectedCar) {
          Renderer.setCurrentCarInfo(lastSelectedCar);
        }
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

// Форматирование даты
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
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

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  DataStore.loadState();
  Renderer.renderCarList();
  TabManager.restoreActiveTab();
  TabManager.addTabClickHandlers();

  EventHandler.addWorkField();

  document.getElementById('add-form').addEventListener('submit', EventHandler.handleAddFormSubmit);
  document.getElementById('search-input').addEventListener('input', filterCars);
});

// Улучшение работы с фокусом на мобильных устройствах
document.addEventListener('DOMContentLoaded', () => {
  const inputFields = document.querySelectorAll('.crm-system__input');

  inputFields.forEach(input => {
    input.addEventListener('focus', () => {
      input.classList.add('focused');
    });

    input.addEventListener('blur', () => {
      input.classList.remove('focused');
    });
  });
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
window.toggleWorkStatus = EventHandler.toggleWorkStatus;
window.startWork = EventHandler.startWork;
