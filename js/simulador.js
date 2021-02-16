// VARIALES GLOBALES

const activosDisponibles = [];
let miCartera = JSON.parse(localStorage.getItem('cartera'));
let misTrades = JSON.parse(localStorage.getItem('trades'));

const miCarteraUI = $('#activosEnCartera');
const misTradesUI = $('#tradesCerrados')
let miCarteraFila;
let misTradesFila;

let index = localStorage.getItem('indexMiCartera') || 0;
let indexMisTrades = localStorage.getItem('indexMisTrades') || 0;

let inputBuscador = $('#inputBuscarUI');

// DEFINICIONES DE OBJETOS

class Activo {
  constructor(
    ticker,
    descripcion,
    precioActual
  ) {
    this.ticker = ticker;
    this.descripcion = descripcion;
    this.precioActual = precioActual
  }
}

class ActivoEnCartera extends Activo {
  constructor(
    ticker,
    descripcion,
    precioActual,
    index,
    nominales,
    fechaDeCompra,
    precioDeCompra,
  ) {
    super(ticker, descripcion, precioActual);
    this.index = index;
    this.nominales = nominales;
    this.fechaDeCompra = fechaDeCompra;
    this.precioDeCompra = precioDeCompra || 0;
  }
}

class ActivoCerrado extends Activo {
  constructor(
    ticker,
    descripcion,
    index,
    nominales,
    fechaDeCompra,
    precioDeCompra,
    fechaDeVenta,
    precioDeVenta,
  ) {
    super(ticker, descripcion);
    this.index = index;
    this.nominales = nominales;
    this.fechaDeCompra = fechaDeCompra;
    this.precioDeCompra = precioDeCompra || 0;
    this.fechaDeVenta = fechaDeVenta;
    this.precioDeVenta = precioDeVenta || 0;
  }
}

let calculaGanancia = (nominales, precioActual, precioDeCompra) => {
  if (nominales && precioActual && precioDeCompra) return ((precioActual - precioDeCompra) * nominales);
  else return 0;
}

let calculaTNA = (fechaDeCompra,  precioDeCompra, precioActual) => {
  if (fechaDeCompra && precioDeCompra && precioActual){

    let pcjGanancia = ((precioActual / precioDeCompra) - 1) * 100;
    
    let hoy = new Date().getTime();
    let diasTranscurridos = Math.floor((hoy - fechaDeCompra)/24/60/60/1000);
    if (diasTranscurridos < 1) return "---"
    return Math.floor(pcjGanancia / diasTranscurridos * 365);
  } else return "---";
}

let tenenciaValorizada = (nominales, precioActual) => {
  if (nominales && precioActual) return nominales*precioActual;
  else return 0;
}

function inputsEstanVacios (input){
  let retorno =0;
  input.forEach(element => {
    if (!element.value){
      element.onfocus = () => {element.style.borderColor = null;}
      element.style.borderColor = "Red";
      retorno =1;
    } 
  });
  return retorno;
}

// FUNCIONES SOBRE STORAGE

const agregaActivo = (activo) => {
  let inputNominales = document.getElementById(activo.ticker + "-nominales");
  let inputFechaDeCompra = document.getElementById(activo.ticker + "-fechaDeCompra");
  let inputPrecioDeCompra = document.getElementById(activo.ticker + "-precioDeCompra"); 
  
  $('#formActivosDisponibles').submit(function (e) { 
    e.preventDefault();
  });

  // VALIDACION DEL FORMULARIO
  if(inputsEstanVacios([inputNominales,inputFechaDeCompra,inputPrecioDeCompra])) return;
  
  let activoParaAgregar = new ActivoEnCartera (activo.ticker,activo.descripcion,activo.precioActual,index++,inputNominales.value,new Date(inputFechaDeCompra.value).getTime(),inputPrecioDeCompra.value);
  miCartera.push(activoParaAgregar);
  localStorage.setItem('cartera', JSON.stringify(miCartera));
  localStorage.setItem('indexMiCartera', index);
  $('#formActivosDisponibles')[0].reset();
  pintarCartera ();
}

const borrarActivo = (index) => {
  miCartera.forEach((e, i) => {
    if(e.index === index) miCartera.splice(i,1);
  });
  localStorage.setItem('cartera', JSON.stringify(miCartera));
  pintarCartera ();
}

const cerrarTrade = (indice) => {
  let activoParaAgregar = new ActivoCerrado (miCartera[indice].ticker,miCartera[indice].descripcion,indexMisTrades++,miCartera[indice].nominales,miCartera[indice].fechaDeCompra,miCartera[indice].precioDeCompra,new Date().getTime(),miCartera[indice].precioActual);
  misTrades.push(activoParaAgregar);
  localStorage.setItem('trades', JSON.stringify(misTrades));
  localStorage.setItem('indexMisTrades', indexMisTrades);
  borrarActivo(miCartera[indice].index);
  pintarTrades();
}

const borrarTrade = (index) => {
  misTrades.forEach((e, i) => {
    if(e.index === index) misTrades.splice(i,1);
  });
  localStorage.setItem('trades', JSON.stringify(misTrades));
  pintarTrades ();
}

const pintarCartera = () => {
  miCarteraFila = "";
  if(miCartera === null){
    miCartera = [];
  }else{
    miCartera.forEach((element, i) => {
      let fechaFormateada = new Date(element.fechaDeCompra).toLocaleDateString();
      let tenencia = tenenciaValorizada(element.nominales, element.precioActual);
      let ganancia = calculaGanancia(element.nominales, element.precioActual, element.precioDeCompra);
      let tna = calculaTNA(element.fechaDeCompra, element.precioDeCompra, element.precioActual);
      miCarteraFila += `
      <tr>
      <th scope="row">${element.ticker}</th>
      <td>${element.descripcion}</td>
      <td class="text-end">${element.nominales}</td>
      <td class="text-end">${fechaFormateada}</td>
      <td class="text-end">$ ${element.precioDeCompra}</td>
      <td class="text-end">$ ${element.precioActual}</td>
      <td class="text-end">$ ${tenencia}</td>
      <td class="text-end">$ ${ganancia}</td>
      <td class="text-end">${tna} %</td>
      <td class="text-end">
      <input type="button" value="Cerrar trade" class="btn btn-outline-success" onclick="cerrarTrade(${i});">
      <input type="button" value="Borrar" class="btn btn-outline-danger" onclick="borrarActivo(${element.index});">
      </td>
      </tr>    
      `;      
    });
  }
  $('#activosEnCartera').hide().html(miCarteraFila).fadeIn(300);
} // ...pintarCartera()

const pintarTrades = () => {
  misTradesFila = "";
  if(misTrades === null){
    misTrades = [];
  }else{
    misTrades.forEach(element => {
      let fechaFormateadaCompra = new Date(element.fechaDeCompra).toLocaleDateString();
      let fechaFormateadaVenta = new Date(element.fechaDeVenta).toLocaleDateString();
      let ganancia = calculaGanancia(element.nominales, element.precioDeVenta, element.precioDeCompra);
      let tna = calculaTNA(element.fechaDeCompra, element.precioDeCompra, element.precioDeVenta);
      misTradesFila += `
      <tr>
      <th scope="row">${element.ticker}</th>
      <td>${element.descripcion}</td>
      <td class="text-end">${element.nominales}</td>
      <td class="text-end">${fechaFormateadaCompra}</td>
      <td class="text-end">$ ${element.precioDeCompra}</td>
      <td class="text-end">${fechaFormateadaVenta}</td>
      <td class="text-end">$ ${element.precioDeVenta}</td>
      <td class="text-end">$ ${ganancia}</td>
      <td class="text-end">${tna} %</td>
      <td class="text-end">
      <input type="button" value="Borrar" class="btn btn-outline-danger" onclick="borrarTrade(${element.index});">
      </td>
      </tr>    
      `;      
    });
  }
  misTradesUI.html(misTradesFila);
} // ...pintarTrades()

// CONSTRUYE LA TABLA CON LOS ACTIVOS DISPONIBLES PARA AGREGAR A LA CARTERA

activosDisponibles.push(new Activo("AMZN", "Amazon", 3420));
activosDisponibles.push(new Activo("GOOGL", "Alphabet Inc.", 5450));
activosDisponibles.push(new Activo("FB", "Facebook Inc.", 5095));
activosDisponibles.push(new Activo("MSFT", "Microsoft Corp.", 3698));
activosDisponibles.push(new Activo("GLBN", "Globant", 5690));


const filtrarActivos = () => {
  const textoBuscado = inputBuscador.val().toLowerCase();
  let activoDisponibleFila = "";
  $('#activosDisponibles').html("");
  for(let activo of activosDisponibles){
    let ticker = activo.ticker.toLowerCase();
    let descripcion = activo.descripcion.toLowerCase();
    if (ticker.indexOf(textoBuscado) !== -1 || descripcion.indexOf(textoBuscado) !== -1 ) {
      activoDisponibleFila = `
      <tr id="${activo.ticker}-fila">
      <th scope="row" class="text-start">${activo.ticker}</th>
      <td class="text-start">${activo.descripcion}</td>
      <td class="text-end">$ ${activo.precioActual}</td>
      <td>
      <input type="number" name="${activo.ticker}-nominales" min="0" class="form-control" id="${activo.ticker}-nominales">
      <div class="invalid-feedback">Invalido</div>
      </td>
      <td><input type="text" name="${activo.ticker}-fechaDeCompra" class="form-control" id="${activo.ticker}-fechaDeCompra"></td>
      <td>
      <div class="input-group">
      <span class="input-group-text">$</span>
      <input type="number" name="${activo.ticker}-precioDeCompra" min="0" class="form-control" id="${activo.ticker}-precioDeCompra">
      </div>
      </td>
      <td class="text-end"><input id="boton-${activo.ticker}" type="submit" value="Agregar a mi cartera" class="btn btn-outline-success w-100"></td>
      </tr>
      `;

      $('#activosDisponibles').append(activoDisponibleFila);

      $("#boton-"+activo.ticker).on('click', () => { 
        agregaActivo(activo);
      });
    }
  }
  if (activoDisponibleFila === "") { $('#activosDisponibles').html('<tr><td colspan="7">Ningun resultado coincide con su busqueda.</td></tr>') };
} // ...filtrarActivos()

filtrarActivos();
$("#inputBuscarUI").keyup(filtrarActivos);


document.addEventListener('DOMContentLoaded', pintarCartera);
document.addEventListener('DOMContentLoaded', pintarTrades);