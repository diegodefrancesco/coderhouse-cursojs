// VARIALES GLOBALES

const activosDisponibles = [];
let miCartera = JSON.parse(localStorage.getItem('cartera'));
let misTrades = JSON.parse(localStorage.getItem('trades'));

const misTradesUI = $('#tradesCerrados')
let miCarteraFila;
let misTradesFila;
let ultimaFila;

let index = localStorage.getItem('indexMiCartera') || 0;
let indexMisTrades = localStorage.getItem('indexMisTrades') || 0;

let inputBuscador = $('#inputBuscarUI');

toastr.options = {
  "closeButton": true, 
  "debug": false, 
  "newestOnTop": true, 
  "progressBar": false, 
  "positionClass": "toast-bottom-right", 
  "preventDuplicates": true, 
  "onclick": null, 
  "showDuration": "1000", 
  "hideDuration": "2000", 
  "timeOut": "2000", 
  "extendedTimeOut": "1000", 
  "showEasing": "swing", 
  "hideEasing": "linear", 
  "showMethod": "fadeIn", 
  "hideMethod": "fadeOut"
}

// DEFINICIONES DE OBJETOS

class Activo {
  constructor(
    ticker,
    precioActual
  ) {
    this.ticker = ticker;
    this.precioActual = precioActual
  }
}

class ActivoEnCartera extends Activo {
  constructor(
    ticker,
    precioActual,
    index,
    nominales,
    fechaDeCompra,
    precioDeCompra,
  ) {
    super(ticker, precioActual);
    this.index = index;
    this.nominales = nominales;
    this.fechaDeCompra = fechaDeCompra;
    this.precioDeCompra = precioDeCompra || 0;
  }
}

class ActivoCerrado extends Activo {
  constructor(
    ticker,
    index,
    nominales,
    fechaDeCompra,
    precioDeCompra,
    fechaDeVenta,
    precioDeVenta,
    ) {
      super(ticker);
    this.index = index;
    this.nominales = nominales;
    this.fechaDeCompra = fechaDeCompra;
    this.precioDeCompra = precioDeCompra || 0;
    this.fechaDeVenta = fechaDeVenta;
    this.precioDeVenta = precioDeVenta || 0;
  }
}

let calculaGanancia = (nominales, precioActual, precioDeCompra) => {
  if (nominales && precioActual && precioDeCompra) return ((precioActual - precioDeCompra) * nominales).toFixed(2);
  else return 0;
}

let calculaTNA = (fechaDeCompra,  precioDeCompra, precioActual) => {
  if (fechaDeCompra && precioDeCompra && precioActual){
    
    let pcjGanancia = ((precioActual / precioDeCompra) - 1) * 100;
    
    let hoy = new Date().getTime();
    let diasTranscurridos = Math.floor((hoy - fechaDeCompra)/24/60/60/1000);
    if (diasTranscurridos < 1) return "---"
    return Math.floor(pcjGanancia / diasTranscurridos * 365).toFixed(2);
  } else return "---";
}

let tenenciaValorizada = (nominales, precioActual) => {
  if (nominales && precioActual) return (nominales*precioActual).toFixed(2);
  else return 0;
}

function inputsEstanVacios (input){
  let retorno =0;
  input.forEach(element => {
    if (!element.value || element.value === 0){
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
  if(inputsEstanVacios([inputNominales,inputFechaDeCompra,inputPrecioDeCompra])) {
    toastr["error"]("Debe completar todos los campos.");
    return;
  }
  
  let activoParaAgregar = new ActivoEnCartera (activo.ticker,activo.precioActual,index++,inputNominales.value,new Date(inputFechaDeCompra.value).getTime(),inputPrecioDeCompra.value);
  miCartera.push(activoParaAgregar);
  localStorage.setItem('cartera', JSON.stringify(miCartera));
  localStorage.setItem('indexMiCartera', index);
  $('#formActivosDisponibles')[0].reset();
  pintarCartera ();
  toastr["success"]("El activo ha sido agregado a su cartera de inversion.");
  
}

function borrarActivo(index, alert = 1) {
  miCartera.forEach((e, i) => {
    if (e.index === index)
      miCartera.splice(i, 1);
  });
  localStorage.setItem('cartera', JSON.stringify(miCartera));
  pintarCartera();
  if (alert)
    toastr["success"]("El activo ha sido borrado de su cartera de inversion.");
}

function cerrarTrade(indice) {
  let activoParaAgregar = new ActivoCerrado (miCartera[indice].ticker,indexMisTrades++,miCartera[indice].nominales,miCartera[indice].fechaDeCompra,miCartera[indice].precioDeCompra,new Date().getTime(),miCartera[indice].precioActual);
  misTrades.push(activoParaAgregar);
  localStorage.setItem('trades', JSON.stringify(misTrades));
  localStorage.setItem('indexMisTrades', indexMisTrades);
  borrarActivo(miCartera[indice].index, 0);
  pintarTrades();
  toastr["success"]("El activo ha sido agregado a sus trades.");
}

const borrarTrade = (index) => {
  misTrades.forEach((e, i) => {
    if(e.index === index) misTrades.splice(i,1);
  });
  localStorage.setItem('trades', JSON.stringify(misTrades));
  pintarTrades ();
  toastr["success"]("El activo ha sido borrado de sus trades.");
}

const pintarCartera = () => {
  miCarteraFila = "";
  ultimaFila = "";
  let sumaCartera = 0;
  if(miCartera === null){
    miCartera = [];
  }else{
    miCartera.forEach((element, i) => {
      let fechaFormateada = new Date(element.fechaDeCompra).toLocaleDateString();
      let tenencia = tenenciaValorizada(element.nominales, element.precioActual);
      let ganancia = calculaGanancia(element.nominales, element.precioActual, element.precioDeCompra);
      let tna = calculaTNA(element.fechaDeCompra, element.precioDeCompra, element.precioActual);
      sumaCartera += parseFloat(tenencia);
      miCarteraFila += `
      <tr>
        <td><a href="https://es.tradingview.com/symbols/NASDAQ-${element.ticker}" target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bar-chart-line-fill" viewBox="0 0 16 16">
          <path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1V2z"/></svg>
          </a>
        </td>
        <th scope="row">${element.ticker}</th>
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
  
  ultimaFila += `
    <tr>
      <td class="text-end" colspan="6"><b>TENENCIA VALORIZADA TOTAL:</b></td>
      <td class="text-end"><b class="fs-5">$ ${sumaCartera.toFixed(2)}</b></td>
      <td class="text-end" colspan="3"></td>
    </tr>
  `;

  $('#activosEnCartera').hide().html(miCarteraFila).fadeIn(500);
  $('#pieDeTablaActivos').hide().html(ultimaFila).fadeIn(500);

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
      <td><a href="https://es.tradingview.com/symbols/NASDAQ-${element.ticker}" target="_blank">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bar-chart-line-fill" viewBox="0 0 16 16">
        <path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1V2z"/></svg>
        </a>
      </td>
      <th scope="row">${element.ticker}</th>
      <td class="text-end">${element.nominales}</td>
      <td class="text-end">${fechaFormateadaCompra}</td>
      <td class="text-end">$ ${element.precioDeCompra}</td>
      <td class="text-end">${fechaFormateadaVenta}</td>
      <td class="text-end">$ ${element.precioDeVenta}</td>
      <td class="text-end">$ ${ganancia}</td>
      <td class="text-end">${tna} %</td>
      <td class="text-end">
      <input type="button" value="Borrar" class="btn btn-outline-danger w-100" onclick="borrarTrade(${element.index});">
      </td>
      </tr>    
      `;      
    });
  }
  misTradesUI.html(misTradesFila);
} // ...pintarTrades()

// CONSTRUYE LA TABLA CON LOS ACTIVOS DISPONIBLES PARA AGREGAR A LA CARTERA

const simbolosDisponibles = ['ADBE','AMD','AMZN','AAPL','GOOGL','FB','MSFT','GILD','INTC','EBAY','NVDA','MELI','QCOM','ZM'];

/* simbolosDisponibles.forEach(element => {
  let url = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol='+element+'&interval=60min&apikey=JZ9SQZS5MHPSDY5A';
  let hoy = moment().format('YYYY-MM-DD');
  fetch(url)
  .then(response => response.json())
  .then(data => {
    activosDisponibles.push(new Activo(element, data['Time Series (Daily)'][hoy]['4. close']));
  })
}); */

simbolosDisponibles.forEach(element => {
  let ayer = moment().subtract(1, 'days').format('YYYY-MM-DD');
  let url = 'http://api.marketstack.com/v1/eod?access_key=ac9fe23bbb0851b123b56bf00b8baf6f&symbols='+element+'&date_from='+ayer;
  fetch(url)
  .then(response => response.json())
  .then(data => {
    let precio = (data.data[0].close).toFixed(2);
    activosDisponibles.push(new Activo(element, precio));
  })
});


const filtrarActivos = () => {
  const textoBuscado = inputBuscador.val().toLowerCase();
  let activoDisponibleFila = "";
  $('#activosDisponibles').html("");
  activosDisponibles.sort(function(a,b){
    return (a.ticker > b.ticker);
  });
  for(let activo of activosDisponibles){
    let ticker = activo.ticker.toLowerCase();
    if (ticker.indexOf(textoBuscado) !== -1 ) {
      activoDisponibleFila = `
      <tr id="${activo.ticker}-fila">
      <td><a href="https://es.tradingview.com/symbols/NASDAQ-${activo.ticker}" target="_blank">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bar-chart-line-fill" viewBox="0 0 16 16">
        <path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1V2z"/></svg>
        </a>
      </td>
      <th scope="row" class="text-start">${activo.ticker}</th>
      <td class="text-end">$ ${activo.precioActual}</td>
      <td>
      <input type="number" name="${activo.ticker}-nominales" min="1" class="form-control" id="${activo.ticker}-nominales">
      <div class="invalid-feedback">Invalido</div>
      </td>
      <td><input type="date" name="${activo.ticker}-fechaDeCompra" class="form-control inputDate" id="${activo.ticker}-fechaDeCompra"></td>
      <td>
      <div class="input-group">
      <span class="input-group-text">$</span>
      <input type="number" name="${activo.ticker}-precioDeCompra" min="0.01" class="form-control" id="${activo.ticker}-precioDeCompra">
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
  $('.inputDate').attr('min', moment().subtract(10, 'years').format('YYYY-MM-DD'));
  $('.inputDate').attr('max', moment().format('YYYY-MM-DD'));
} // ...filtrarActivos()

setTimeout(function(){filtrarActivos()}, 3000);

$("#inputBuscarUI").keyup(filtrarActivos);

pintarCartera();
pintarTrades();

$("#limpiaBusqueda").on('click', (e) => { 
  e.preventDefault();
  inputBuscador.val("");
  filtrarActivos();
});

function iconoVar(val){
  let valFloat = parseFloat(val.replace(',', '.'));
  if (valFloat > 0) return "<i class='bi bi-caret-up-fill text-success'></i>";
  else if (valFloat == 0) return "<i class='bi bi-caret-right-fill text-secondary'></i>";
  else return "<i class='bi bi-caret-down-fill text-danger'></i>";
}

function formatoPorcentaje(nStr){
	nStr += '';
	x = nStr.split(',');
	x1 = x[0];
	x2 = x.length > 1 ? ',' + x[1].slice(0,2) : ',00';
	return x1 + x2;
}

function dolarFormateado(data){
  x = data.venta.split(',');
  (x[1]) ? x[1]=x[1].slice(0,2) : x[1] = "00";
  venta = x.join(',');
  return "<b class='text-white'>$ "+venta+"</b> "+iconoVar(data.variacion)+" "+formatoPorcentaje(data.variacion)+" %"
}

fetch('https://www.dolarsi.com/api/api.php?type=valoresprincipales')
.then(response => response.json())
.then(data => {
  $('#solidario').html(dolarFormateado(data[6].casa));
  $('#mep').html(dolarFormateado(data[4].casa));
  $('#ccl').html(dolarFormateado(data[3].casa));
  $('#blue').html(dolarFormateado(data[1].casa))
});
