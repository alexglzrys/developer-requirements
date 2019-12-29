## Formularios

#### Controles múltiples, validación y almacenamiento asíncrono

La validación es una cuestión central para crear formularios que es raro tener un formulario sin ella. La validación puede realizarse en campos individuales como en el formulario completo.

- Cuando valida en un campo individual, se asegura de que el usuario haya ingresado datos que se ajusten a las expectativas y restricciones de su aplicación en relación con ese dato. Por ejemplo, en un formulario, a menudo se espera que ingresemos una contraseña de al menos una longitud mínima. Otro ejemplo sería asegurarse de que un código postal tenga exactamente cinco (o nueve) caracteres numéricos.
- La validación en el formulario en su conjunto es ligeramente diferente. Aquí es donde nos aseguraremos de que se hayan ingresado todos los campos obligatorios. Este también es un buen lugar para verificar la consistencia interna entre los campos. Por ejemplo, asegurarse de que los campos "contraseña" y "volver a escribir contraseña" sean iguales.

Además, hay compensaciones para "cómo" y "cuándo" validamos. En algunos campos, es posible que deseemos enviar comentarios de validación en tiempo real. Por ejemplo, podríamos querer mostrar la fuerza de la contraseña (observando la longitud y los caracteres utilizados) mientras el usuario escribe. Sin embargo, si queremos validar la disponibilidad de un nombre de usuario, podríamos esperar hasta que el usuario haya terminado de escribir antes de hacer una solicitud al servidor / base de datos para averiguarlo.

También tenemos opciones para mostrar los errores de validación. Podríamos diseñar el campo de manera diferente (por ejemplo, un contorno rojo), mostrar texto cerca del campo (por ejemplo, "Ingrese un correo electrónico válido") y / o deshabilitar el botón de envío del formulario para evitar que el usuario avance con información no válida. 

### Resumen Técnico

Para evitar agregar una propiedad para cada entrada de datos en el modelo, agrupamos todas las propiedades relacionadas dentro de un objeto en la data() del componente.
```
<input v-model="fields.newItem" type="text">
<input v-model="fields.email" type="email" >

...

data() {
  return {
    fields: {
      newItem: '',
      email: '',
      urgency: '',
      termsAndConditions: false,
    },
  }
}
``` 
v-model se asegura de que todos los datos terminen en el lugar correcto mediante la actualización de las propiedades de datos apropiadas (en este caso limpiamos el contenido de nuestros elementos de formulario) dentro de un método declarado en el componente
```
methods: {
  save() {
    this.fields = {
      newItem: '',
      email: '',
      urgency: '',
      termsAndConditions: false,
    }
  }
}
```
Para validar el formulario, necesitamos un objeto para almacenar los errores de validación, si es que existen. (Field-Errors). Esto debe ser declarado como una data() mas en el componente, pues forma parte de su estado.

Las buenas prácticas de Vue afirman que es necesario declarar las propiedades que deben ser reactivas por adelantado, para garantizar un comportamiento coherente en todos los navegadores
```
data() {
  return {
    fieldErrors: {
      newItem: undefined,
      email: undefined,
      urgency: undefined,
      termsAndConditions: undefined,
    },
  }
}
```

Para mostrar los errores de validación al usuario, es necesario crear bloques / plantillas de error y adjuntarlos con los campos a validar.
```
<span style="color: red">{{ fieldErrors.newItem }}</span>
```
La validación de campos de formulario debe tratarse como una tarea independiente. Por tanto, se recomienda encapsularla en un metodo del componente y llamarla antes de realizar el proceso de almacenamiento de información.

```
validateForm(fields) {

  // objeto para almacenar posibles errores de validación
  const errors = {}

  // Comprobar si los campos están vacíos
  if (!fields.newItem) errors.newItem = 'El producto solicitante es requerido'
  if (!fields.email) errors.email = 'El correo electrónico es requerido'
  if (!fields.urgency) errors.urgency = 'El nivel de urgencia es requerido'
  if (!fields.termsAndConditions) {
    errors.termsAndConditions = 'Los términos y condiciones deben ser aprobados'
  }

  // Devolver el objeto de posibles errores de validación.
  return errors
},
```
**Validaciones a nivel global de formulario**

Tras enviar el formulario, en el controlador del evento se invoca al método de validación y se determina si hay necesidad de parar la ejecución de la tarea de guardado, esto para mostrar los errores de validación al usuario a través de la vista
```
submitForm(event) {
  event.preventDefault()

  this.fieldErrors = this.validateForm(this.fields)
  if (Object.keys(this.fieldErrors).length) return

  ... 
  continuar con el proceso de guardado
}
```
**Validaciones en tiempo real**

En Vue, se emplean propiedades calculadas para realizar la validación a nivel de campo de formulario sobre la marcha.
```
computed: {
  isNewItemInputLimitExceeded() {
    return this.fields.newItem.length >= 20
  },
}
```
Nuevamente, se debe designar un bloque / plantilla de error para mostrar el error. Todo ello, con base a una condición (valor booleano devuelto por la propiedad calculada)
```
<span v-if="isNewItemInputLimitExceeded" style="color: red; display: block">
  Debe tener menos de veinte caracteres
</span>
```

**Propiedades calculadas VS Métodos (validación)**

Se puede lograr el mismo resultado haciendo uso de metodos (los cuales se activen a través del evento @change), sin embargo, al haber un cambio estos se ejecutarían siempre (generando costos de ejecución). A diferencia de las propiedades calculadas, que solo se reevaluan si alguno de sus datos dependientes cambia, mientras tanto, su valor permanece almacenado en caché

**Almacenamiento Asíncrono**

En la mayoría de las aplicaciones web, cuando un usuario ingresa datos, esos datos deben enviarse a un servidor para su custodia en una base de datos. Cuando el usuario regresa a la aplicación, los datos se pueden recuperar y la aplicación puede volver a funcionar justo donde la dejó. 

- La API localStorage le permite leer y escribir **pares de clave-valor** en un almacén integrado en el navegador del usuario. Puede almacenar elementos en localStorage con setItem ()
```
localStorage.setItem('clave', valor)

localStorage.getItem('clave')
```
- Tenga en cuenta que los datos almacenados en localStorage no tienen caducidad.
- En el proyecto, se ha simulado el comportamiento asíncrono al envolver las operaciones de localStorage en funciones **setTimeout y Promises**

En tareas asincronas, es importante agregar propiedades al modelo del componente / aplicación para monitorear el estado actual de las operaciones (persistencia en proceso, carga de información, error de persisitencia, persistencia exitosa)
```
data() {
  return {
    ...
    loading: false,
    saveStatus: 'READY',  // READY | SAVING | SUCCESS | ERROR
  }
}
```
Las propiedades que hacen referencia al estado de la operación en el componente, deben modificarse en cada parte del proceso. 
```
created() {
  // Mostrar el indicador spinner (loading)
  this.loading = true

  apiClient.loadItems().then((items) => {
    this.items = items
    
    // Terminada la carga de información, ocultar el spinner
    this.loading = false
  })
}
```
Mediante las directivas v-if, podemos reaccionar y mostrar diferentes mensajes / elementos en la vista para notificar al usuario del proceso / avance de la solicitud
```
<div v-if="loading" class="ui active inline loader"></div>
``` 
Existen muchas formas para impedir que un usuario continúe con el envío del formulario si alguno de los datos no son válidos. Lo más común es deshabilitar el botón de envío.

Por otra parte, podemos declarar N cantidad de botones de envío, pero solo mostrar uno con base al estado actual del proceso. Esto mejora la experiencia de usuario.
```
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
```
---

**Nota:** En aras de la brevedad y buenas prácticas, es importante el ser conservadores con la actualización de la interfaz de usuario. Es decir, solo debemos agregamos el nuevo elemento al modelo del componente (lista) si la petición al servidor tiene éxito. 
Esto contrasta con una actualización optimista, en la que primero agregaríamos el elemento a la lista localmente y luego realizaríamos ajustes si hubiera un error (lo que hacen muchos ejemplos en la red). 

En desarrollos profesionales, la validación de campos de formulario debe llevarse a cabo mediante la ayuda de librerías externas; tales como **Validate** (https://monterail.github.io/vuelidate/)