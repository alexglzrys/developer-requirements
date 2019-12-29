/**
 * NOTA IMPORTANTE: 
 * Al declarar una propiedad como parte del estado, se debe cuestionar si
 * dicha propiedad estará disponible para todos o la mayoría de los 
 * componentes de la aplicación
 *
 */


// El estado global de la aplicación se conforma de la información de los campos de formulario y la lista de elementos persistentes
const state = {
  fields: {
    newItem: '',
    email: '',
    urgency: '',
    termsAndConditions: false,
  },
  items: [],
}

// La mayoría de nuestras mutaciones tienen como objetivo actualizar el estado con la información proporcionada a través de los campos de formulario (Data Binding)
const mutations = {
  UPDATE_NEW_ITEM(state, payload) {
    state.fields.newItem = payload
  },
  UPDATE_EMAIL(state, payload) {
    state.fields.email = payload
  },
  UPDATE_URGENCY(state, payload) {
    state.fields.urgency = payload
  },
  UPDATE_TERMS_AND_CONDITIONS(state, payload) {
    state.fields.termsAndConditions = payload
  },
  // Mutaciones para actualizar la lista de elementos (agregar elemento) y borrar todos los campos de formulario.
  UPDATE_ITEMS(state, payload) {
    state.items = payload
  },
  CLEAR_FIELDS(state) {
    state.fields.newItem = ''
    state.fields.email = ''
    state.fields.urgency = ''
    state.fields.termsAndConditions = false
  }
}


// Las acciones de Vue son asíncronas.
// En este sentido, cuando hacemos peticiones al servidor se deben gestionar haciendo uso de promesas o callbacks. Esto para que la aplicación o componentes sepan que hacer en cada punto del proceso.
const actions = {
  loadItems(context, payload) {
    return new Promise((resolve, reject) => {
      apiClient.loadItems().then(function (items) {
        context.commit('UPDATE_ITEMS', items)
        resolve(items)
      }, (error) => {
        reject(error)
      })
    })

  },
  saveItems(context, payload) {
    return new Promise((resolve, reject) => {
      const items = payload
      apiClient.saveItems(payload).then(function (response) {
        context.commit('UPDATE_ITEMS', items)
        context.commit('CLEAR_FIELDS')
        resolve(response)
      }, (error) => {
        reject(error)
      })

    })
  }
}

// Crear los getters necesarios para alimentar nuestra aplicación con la información de estado almacenada en nuestro store.
const getters = {
  newItem: state => state.fields.newItem,
  email: state => state.fields.email,
  urgency: state => state.fields.urgency,
  termsAndConditions: state => state.fields.termsAndConditions,
  items: state => state.items,

  newItemLength: state => state.fields.newItem.length,
  isNewItemInputLimitExceeded: state => state.fields.newItem.length >= 20,
  isNotUrgent: state => state.fields.urgency === 'No Esencial',
}


// Inyectamos la construcción de la tienda en el objeto global window para que esté disponible en toda la aplicación
window.store = new Vuex.Store({
  state,
  mutations,
  actions,
  getters,
})


// Objeto de simulación de carga y persistencia de información asincrona que trabaja alrededor del API LocalStorage del navegador.
let apiClient = {
  loadItems: function () {
    return {
      then: function (callback) {
        setTimeout(() => {
          callback(JSON.parse(localStorage.items || '[]'))
        }, 2000)
      }
    }
  },
  saveItems: function (items) {
    const success = !!(this.count++ % 2)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!success) return reject({ success })
        localStorage.items = JSON.stringify(items)
        return resolve({ success })
      }, 1000)
    })
  },
  count: 1,
}