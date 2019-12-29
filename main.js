const InputForm = {
  template: `
    <form @submit="submitForm" class="ui form">
      <div class="field">
        <label>Nuevo Producto Solicitado</label>
        <input :value="newItem" @input="onInputChange" name="NEW_ITEM" type="text" placeholder="Añada un nuevo producto!">
        <span style="float: right">{{newItemLength}}/20</span>
        <span style="color: red">{{ fieldErrors.newItem }}</span>
        <span v-if="isNewItemInputLimitExceeded"
          style="color: red; display: block">
          Debe tener menos de veinte caracteres
        </span>
      </div>

      <div class="field">
        <label>Email</label>
        <input :value="email" @input="onInputChange" name="EMAIL" type="text" placeholder="¿Cual es tu email?">
        <span style="color: red">{{ fieldErrors.email}}</span>
      </div>

      <div class="field">
        <label>Nivel de Urgencia</label>
        <select :value="urgency" @change="onInputChange" name="URGENCY" class="ui fluid search dropdown">
          <!-- Primer campo de opción vacío y deshabilitado para tener compatibilidad con iOS -->
          <option disabled value="">Por favor, seleccione una</option>
          <option>No Esencial</option>
          <option>Moderada</option>
          <option>Urgente</option>
        </select>

        <!-- Template Error -->
        <span style="color: red">{{ fieldErrors.urgency }}</span>
        <span v-if="isNotUrgent"
          style="color: red; display: block;">
          Su solicitud debe ser considerada de Moderada a Urgente
        </span>
      </div>

      <div class="field">
        <div class="ui checkbox">
          <!-- v-model siempre elige la forma correcta de actualizar el elemento en función del tipo de entrada que se este vinculando -->
          <input :checked="termsAndConditions" @change="onInputChange" name="TERMS_AND_CONDITIONS" type="checkbox">
          <label>Acepto los términos y condiciones del servicio</label>

          <!-- Template Error -->
          <span style="color: red">{{ fieldErrors.termsAndConditions }}</span>
        </div>
      </div>


      <button v-if="saveStatus === 'READY'" 
        :disabled="isNewItemInputLimitExceeded || isNotUrgent" 
        class="ui button">
        Enviar
      </button>
      <button v-if="saveStatus === 'SUCCESS'" 
        :disabled="isNewItemInputLimitExceeded || isNotUrgent" 
        class="ui button">
        Guardado Exitoso!, Enviar otro
      </button>
      <button v-if="saveStatus === 'ERROR'" 
        :disabled="isNewItemInputLimitExceeded || isNotUrgent" 
        class="ui button">
        Guardado Fallido, Reintentar?
      </button>
      <button v-if="saveStatus === 'SAVING'" 
        disabled 
        class="ui button">
        Guardando cambios...
      </button>

      <div class="ui segment">
        <h4 class="ui header">Productos Requeridos</h4>
        <ul>
          <!-- Mostrar indicador de carga si la app aun esta esperando respuesta del servidor. Semantic UI cuenta spinner integrado -->
          <div v-if="loading" class="ui active inline loader"></div>
          <li v-for="item in items" class="item">{{ item }}</li>
        </ul>
      </div>
    </form>
  `,
  data() {
    return {
      // Nuestro componente solo se preocupa por los errores de validación, carga de información y el estado de guardado del botón.
      fieldErrors: {
        newItem: undefined,
        email: undefined,
        urgency: undefined,
        termsAndConditions: undefined
      },
      loading: false,
      saveStatus: "READY" // READY | SAVING | SUCCESS | ERROR
    };
  },
  /**
   * Existen dos formas de enlazar un campo de formulario con una propiedad declarada en el estado Vuex (para evitar mutarla directamente).
   *
   * - La recomendada es enlazar la propiedad value del control de formulario a una propiedad computada (getter), y escuchar cualquier cambio en la entrada (evento) e invocar un controlador de eventos que invoque una acción/mutación del store para solicitar el cambio.
   */
  computed: Vuex.mapGetters({
    newItem: "newItem",
    email: "email",
    urgency: "urgency",
    termsAndConditions: "termsAndConditions",
    items: "items",

    newItemLength: "newItemLength",
    isNewItemInputLimitExceeded: "isNewItemInputLimitExceeded",
    isNotUrgent: "isNotUrgent"
  }),
  methods: {
    onInputChange(event) {
      // Un solo controlador de eventos para DataBinding con el state de nuestro store
      const element = event.target;

      // Nota:
      // el evento @input se dispara cuando cambia el contenido de texto de un control
      // el evento @change se dispara cuando cambia la selección o marcado de un control

      // Verificar si se trata de un elemento de tipo checkbox, ya que estos su valor lo tienen declarado en el atributo checked
      const value =
        element.name === "TERMS_AND_CONDITIONS"
          ? element.checked
          : element.value;

      // Confirmar la mutación específica para cada control de formulario. Nos ahorramos un paso adicional al no declarar acciones para estas mutaciones dentro del store.
      this.$store.commit(`UPDATE_${element.name}`, value);
    },
    submitForm(event) {
      event.preventDefault();

      this.fieldErrors = this.validateForm();
      if (Object.keys(this.fieldErrors).length) return;

      // Generar una lista con los nuevos cambios. (elementos anteriores y nuevos)
      const items = [
        ...this.$store.state.items,
        this.$store.state.fields.newItem
      ];

      this.saveStatus = "SAVING";

      this.$store
        .dispatch("saveItems", items)
        .then(() => {
          this.saveStatus = "SUCCESS";
        })
        .catch(err => {
          this.saveStatus = "ERROR";
          console.log(err);
        });
    },
    validateForm() {
      // crear objeto para almacenar los posibles errores de validación
      const errors = {};

      if (!this.$store.state.fields.newItem)
        errors.newItem = "El producto solicitante es requerido";
      if (!this.$store.state.fields.email)
        errors.email = "El correo electrónico es requerido";
      if (!this.$store.state.fields.urgency)
        errors.urgency = "El nivel de urgencia es requerido";
      if (!this.$store.state.fields.termsAndConditions) {
        errors.termsAndConditions =
          "Los términos y condiciones deben ser aprobados";
      }

      // Comprobar si el email es valido
      if (
        this.$store.state.fields.email &&
        !this.isEmail(this.$store.state.fields.email)
      ) {
        errors.email = "Correo electrónico no válido";
      }

      // Devolver el objeto de posibles errores de validación. Si esta vacío no hay errores y se puede continuar, en caso contario, si los hay y es necesario notificar
      return errors;
    },
    isEmail(email) {
      const expresion_regular = /\S+@\S+\.\S+/;
      return expresion_regular.test(email);
    }
  },
  created() {
    // Una vez terminado de crear el componente y antes de que se monte en el DOM, hago una petición para solicitar los datos previamentes guardados en localStorage y poder proyectarlos dentro del componente
    this.loading = true;
    this.$store
      .dispatch("loadItems")
      .then(response => {
        this.loading = false;
      })
      .catch(error => {
        console.log(error);
      });
  }
};

new Vue({
  el: "#app",
  // la tienda se encuentra en el objeto global window (disponible en toda la app)
  store,
  components: {
    "input-form": InputForm
  }
});
