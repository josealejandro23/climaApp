const fs = require("fs");

const axios = require("axios").default;

class Busquedas {
   historial = [];
   path = "./db/";
   fileName = "data.json";

   constructor() {
      this.leerDB();
   }

   get paramsMapBox() {
      //se indica que habrán 3 querys access_token=adfasf&language=es&limit=5
      return { 
         access_token: process.env.MAPBOX_TOKEN, 
         language: "es", 
         limit: 5 };
   }

   get paramsWeather() {
      return {
         lang: "es",
         units: "metric",
         appid: process.env.OPENWEATHER_KEY,
      };
   }

   get historialCapitalizado() {
      //para cada objeto del historial se pasan sus primeras letras a mayúsculas con una expresión y se retorna el arreglo correspondiente
      return this.historial.map((nombre) => {
         return nombre.replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()));
      });
   }

   //--función que hace una petición para solicitar lugares coincidentes con el termino de búsqueda recibido
   async buscarLugar(lugar = "") {
      //se inicializa el arreglo de respueta
      let lugares = [];
      try {
         //se cambian los espacios en blanco por %20
         lugar.replace(" ", "%20");
         //se inicia una instancia de Axios para poder hacer peticiones recurrentes
         const instance = axios.create({
            //se indica la url báse hasta antes de definir los querys de la petición
            baseURL: `https://api.mapbox.com/geocoding/v5/mapbox.places/${lugar}.json`,
            timeout: 15000,
            //se cargan los querys de la petición mediante la propiedad params
            params: this.paramsMapBox,
         });
         //se hace la petición get con la instancia creada
         const res = await instance.get();
         // se lee la data recibida en la respueta y se lee la llave features que contiene la info de los lugares
         //para cada objeto en el arreglo de respuesta se crea un objeto con las propiedades de interés
         return res.data.features.map((lugar) => ({
            id: lugar.id,
            nombre: lugar.place_name,
            lon: lugar.center[0],
            lat: lugar.center[1],
         }));
      } catch (e) {
         console.error(e);
      }
   }

   //--función que hace una petición para obtener el clima de x,y coordenadas
   async consultarClima(lat, lon) {
      try {
         //instancia de axios para la petición
         const instancia = axios.create({
            baseURL: `https://api.openweathermap.org/data/2.5/weather`,
            timeout: 15000,
            //se cargan las querys de la petición y se añade la longitud y latitud
            params: { ...this.paramsWeather, lat, lon },
         });
         //se hace la petición GET y se desestructura para obtener el response que viene en la llave data
         const { data } = await instancia.get();
         //se retorna el objeto de interés
         return {
            desc: data.weather[0].description,
            tempActual: data.main.temp,
            min: data.main.temp_min,
            max: data.main.temp_max,
         };
      } catch (e) {
         console.error("Error al consultar el clima del lugar:", e);
      }
   }

   //Función que guarda en base de datos el historial de búsquedas
   guardarHistorial(lugar = "") {
      //si el arreglo de historial ya contiene el lugar recibido entonces no se almacena. 
      if (this.historial.includes(lugar.toLocaleLowerCase())) 
         return;      

      //se recorta el arreglo a solo 5 valores para evitar que cresca demasiado
      //splice elimina los elementos desde la posición 0 a la 4 y los retorna como un arreglo
      this.historial = this.historial.splice(0, 4);
      //se inserta al inicio del historial el núevo lugar buscado
      this.historial.unshift(lugar.toLocaleLowerCase());
      //se almacena el historial en DB
      this.guardarDB();
   }

   guardarDB() {
      try {
         //se crea un objeto que contiene el historial, es útil para almacenar más información
         const payload = {
            historial: this.historial,
         };
         //si no existe el directorio a la DB entonces se crea
         if (!fs.existsSync(this.path)) fs.mkdirSync(this.path);
         //se guarda en un archivo el historial como un string de json
         fs.writeFileSync(this.path + this.fileName, JSON.stringify(payload));
      } catch (e) {
         console.error(e);
      }
   }

   leerDB() {
      try {
         //se valida que exista la db
         if (fs.existsSync(this.path + this.fileName)) {
            //se lee el archivo y se parsea como json
            const info = fs.readFileSync(this.path + this.fileName, { encoding: "utf-8" });
            const data = JSON.parse(info);
            //se carga la propiedad historial con la llave historial de la data parseada
            this.historial = data.historial;
         }
      } catch (e) {
         console.error(e);
      }
   }
}

module.exports = Busquedas;
