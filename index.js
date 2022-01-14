//-- Paquete para cargar información desde el archivo .env a el process.env
require("dotenv").config();
//-- importamos la configuración de yargs para el manejo de parámetros por consola
require('yargs').argv;

const { imprimirMensaje, inquirerPause, inquirerMenu, listarLugares } = require("./helpers/inquirer");
const Busquedas = require("./models/busquedas");

const main = async () => {
   console.clear();
   let opt;
   //--se crea un objeto de tipo Busquedas
   const busquedas = new Busquedas();
   do {
      //--se imprime y espera el menú
      opt = await inquirerMenu();
      console.clear();
      switch (opt) {
         case 1:
            //Se pregunta por el nombre del lugar de interés
            const lugar = await imprimirMensaje("Ingrese el nombre del lugar a buscar");
            //se realiza la petición para obtener el listado de lugares coincidentes
            const lugares = await busquedas.buscarLugar(lugar);
            //seleccionar lugar
            const idLugar = await listarLugares(lugares);
            //si se cancela se continua a la siguiente iteración
            if(idLugar ===  '0') continue;
            //se guarda el objeto cuyo id concuerde con el id del lugar selecionado por el usuario en el paso anterior
            const lugarSelec = lugares.find(lugar => lugar.id === idLugar);
            //se guarda en DB
            busquedas.guardarHistorial(lugarSelec.nombre);
            //consultar clima
            const clima = await busquedas.consultarClima(lugarSelec.lat, lugarSelec.lon);
            //mostrar información
            console.log("\n Información del lugar \n".yellow);
            console.log("Lugar:",`${lugarSelec.nombre}`.green);
            console.log("Latitud:", `${lugarSelec.lat}`.green, "; Longitud:", `${lugarSelec.lon}`.green);
            console.log("Clima actual:",clima.desc.green);
            console.log("Temperatura:", clima.tempActual);
            console.log("Temperatura mínima:", clima.min);
            console.log("Temperatura máxima:", clima.max);
            break;
         case 2:
            busquedas.historialCapitalizado.forEach((lugar,i)=>{
               const idx = `${i + 1}.`.green;
               console.log(`${idx} ${lugar}`)
            })
            break;
      }
      if (opt !== 0) await inquirerPause();
   } while (opt !== 0);
};

main();
