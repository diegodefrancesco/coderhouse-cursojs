// VARIALES GLOBALES

let miCartera = JSON.parse(localStorage.getItem('cartera'));
let misTrades = JSON.parse(localStorage.getItem('trades'));

const misTradesUI = $('#tradesCerrados')
let miCarteraFila;
let misTradesFila;
let ultimaFila;

let index = localStorage.getItem('indexMiCartera') || 0;
let indexMisTrades = localStorage.getItem('indexMisTrades') || 0;

let inputBuscador = $('#inputBuscarUI');

let criptosCantidad = 10;

let url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page='+criptosCantidad+'&page=1&sparkline=false&price_change_percentage=24h';

const activosDisponibles = [];

toastr.options = {"closeButton": true, "debug": false, "newestOnTop": true, "progressBar": false, "positionClass": "toast-bottom-right", "preventDuplicates": true, "onclick": null, "showDuration": "1000", "hideDuration": "2000", "timeOut": "2000", "extendedTimeOut": "1000", "showEasing": "swing", "hideEasing": "linear", "showMethod": "fadeIn", "hideMethod": "fadeOut"}

// DEFINICIONES DE OBJETOS

class Activo {
  constructor(
    ticker,
    precioActual,
    image
    ) {
    this.ticker = ticker;
    this.precioActual = precioActual;
    this.image = image
  }
}

class ActivoEnCartera extends Activo {
  constructor(
    ticker,
    precioActual,
    image,
    index,
    nominales,
    fechaDeCompra,
    precioDeCompra,
  ) {
    super(ticker, precioActual, image);
    this.index = index;
    this.nominales = nominales;
    this.fechaDeCompra = fechaDeCompra;
    this.precioDeCompra = precioDeCompra || 0;
  }
}

class ActivoCerrado extends Activo {
  constructor(
    ticker,
    image,
    index,
    nominales,
    fechaDeCompra,
    precioDeCompra,
    fechaDeVenta,
    precioDeVenta,
    ) {
    super(ticker);
    this.image = image;
    this.index = index;
    this.nominales = nominales;
    this.fechaDeCompra = fechaDeCompra;
    this.precioDeCompra = precioDeCompra || 0;
    this.fechaDeVenta = fechaDeVenta;
    this.precioDeVenta = precioDeVenta || 0;
  }
}

// FUNCIONES SOBRE STORAGE

const agregaActivo = (activo) => {
  let inputNominales = document.getElementById(activo.ticker + "-nominales");
  let inputFechaDeCompra = document.getElementById(activo.ticker + "-fechaDeCompra");
  let inputPrecioDeCompra = document.getElementById(activo.ticker + "-precioDeCompra"); 
  
  $('#formActivosDisponibles').submit(function (e) { 
    e.preventDefault();
  });
  if(inputsEstanVacios([inputNominales,inputFechaDeCompra,inputPrecioDeCompra])) {
    toastr["error"]("Debe completar todos los campos.");
    return;
  }
  let activoParaAgregar = new ActivoEnCartera (activo.ticker,activo.precioActual,activo.image,index++,inputNominales.value,new Date(inputFechaDeCompra.value).getTime(),inputPrecioDeCompra.value);
  miCartera.push(activoParaAgregar);
  localStorage.setItem('cartera', JSON.stringify(miCartera));
  localStorage.setItem('indexMiCartera', index);
  $('#formActivosDisponibles')[0].reset();
  pintarCartera ();
  toastr["success"]("El activo ha sido agregado a su cartera de inversion.");
}

const borrarActivo = (index, alert = 1) => {
  miCartera.forEach((e, i) => {
    if (e.index === index)
    miCartera.splice(i, 1);
  });
  localStorage.setItem('cartera', JSON.stringify(miCartera));
  pintarCartera();
  if (alert)
    toastr["success"]("El activo ha sido borrado de su cartera de inversion.");
}

const cerrarTrade = (indice) => {
  let activoParaAgregar = new ActivoCerrado (miCartera[indice].ticker,miCartera[indice].image,indexMisTrades++,miCartera[indice].nominales,miCartera[indice].fechaDeCompra,miCartera[indice].precioDeCompra,new Date().getTime(),miCartera[indice].precioActual);
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

const iconoVar = (val) => {
  let valFloat = parseFloat(val.replace(',', '.'));
  if (valFloat > 0) return "<i class='bi bi-caret-up-fill text-success'></i>";
  else if (valFloat == 0 || val === "No Cotiza") return "<i class='bi bi-caret-right-fill text-secondary'></i>";
  else return "<i class='bi bi-caret-down-fill text-danger'></i>";
}

const formatoPorcentaje = (nStr) => {
	nStr += '';
	x = nStr.split(',');
	x1 = x[0];
	x2 = x.length > 1 ? ',' + x[1].slice(0,2) : ',00';
	return x1 + x2;
}

const dolarFormateado = (data) => {
  x = data.venta.split(',');
  (x[1]) ? x[1]=x[1].slice(0,2) : x[1] = "00";
  venta = x.join(',');
  if (data.venta === "No Cotiza" || data.compra === "No Cotiza") return "<b class='text-white'>$ "+venta+"</b> "+iconoVar(data.variacion)+" No cotiza";
  return "<b class='text-white'>$ "+venta+"</b> "+iconoVar(data.variacion)+" "+formatoPorcentaje(data.variacion)+" %"
}

const filtrarActivos = () => {
  const textoBuscado = inputBuscador.val().toLowerCase();
  let activoDisponibleFila;
  $('#activosDisponibles').html("");
  for(let activo of activosDisponibles){
    let ticker = activo.ticker.toLowerCase();
    if (ticker.indexOf(textoBuscado) !== -1 ) {
      activoDisponibleFila = `
      <tr id="${activo.ticker}-fila">
      <td><img src="${activo.image}" width="25px"></td>
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
      <td class="botonera text-end"><input id="boton-${activo.ticker}" type="submit" value="Agregar a mi cartera" class="btn btn-outline-success w-100"></td>
      </tr>
      `;
      $('#activosDisponibles').append(activoDisponibleFila);
      $('.botonera').on('click', "#boton-"+activo.ticker, () => { 
          agregaActivo(activo);
      });
    }
  }
  if (!activoDisponibleFila) { $('#activosDisponibles').html('<tr><td colspan="7"><i>Ningun resultado coincide con su busqueda.</i></td></tr>') };
  $('.inputDate').attr('min', moment().subtract(10, 'years').format('YYYY-MM-DD'));
  $('.inputDate').attr('max', moment().format('YYYY-MM-DD'));
} // ...filtrarActivos()

const calculaGanancia = (nominales, precioActual, precioDeCompra) => {
  if (nominales && precioActual && precioDeCompra) return ((precioActual - precioDeCompra) * nominales).toFixed(2);
  else return 0;
}

const calculaTNA = (fechaDeCompra,  precioDeCompra, precioActual) => {
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

const inputsEstanVacios = (input) => {
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

const pintarCartera = () => {
  miCarteraFila = "";
  ultimaFila = "";
  let sumaCartera = 0;
  if (miCartera === null) {
    miCartera = [];
  } else {
    miCartera.forEach((element, i) => {
      let fechaFormateada = new Date(element.fechaDeCompra).toLocaleDateString();
      let tenencia = tenenciaValorizada(element.nominales, element.precioActual);
      let ganancia = calculaGanancia(element.nominales, element.precioActual, element.precioDeCompra);
      let tna = calculaTNA(element.fechaDeCompra, element.precioDeCompra, element.precioActual);
      sumaCartera += parseFloat(tenencia);
      miCarteraFila += `
    <tr>
      <td><img src="${element.image}" width="25px"></td>
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
    if (miCartera.length !== 0) {
      ultimaFila += `
      <tr>
      <td class="text-end" colspan="6"><b>TENENCIA VALORIZADA TOTAL:</b></td>
      <td class="text-end"><b class="fs-5">$ ${sumaCartera.toFixed(2)}</b></td>
      <td class="text-end" colspan="3"></td>
      </tr>
      `;
    } else {
      miCarteraFila += `
      <tr>
      <td colspan="10"><i>No existen activos en su cartera</i></td>
      </tr>
      `;
    }
  }
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
      <td><img src="${element.image}" width="25px"></td>
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
  if (misTrades.length === 0) {
    misTradesFila += `
    <tr>
    <td colspan="10"><i>No existen trades cerrados</i></td>
    </tr>
    `;
  }
  misTradesUI.hide().html(misTradesFila).fadeIn(500);

} // ...pintarTrades()


$(document).ready(function () {
  
  fetch('https://www.dolarsi.com/api/api.php?type=valoresprincipales')
  .then(response => response.json())
  .then(data => {
    $('#solidario').html(dolarFormateado(data[6].casa));
    $('#mep').html(dolarFormateado(data[4].casa));
    $('#ccl').html(dolarFormateado(data[3].casa));
    $('#blue').html(dolarFormateado(data[1].casa))
  });

  fetch(url)
  .then(response => response.json())
  .then(data => {
    data.forEach(element => {
      activosDisponibles.push(new Activo(element.name, element.ath,element.image));
    });
    filtrarActivos();
  })

  $("#inputBuscarUI").keyup(filtrarActivos);

  pintarCartera();

  pintarTrades();

  $("#limpiaBusqueda").on('click', (e) => { 
    e.preventDefault();
    inputBuscador.val("");
    filtrarActivos();
  });
  
  if($('#switch').prop('checked', true)) $('#switch').prop('checked', false);
  $('#switch').on('change', () => {
    $('#activosDisponiblesContainer').fadeToggle(100, 'linear');
    $('#miCarteraContainer').fadeToggle(100, 'linear');

 /*    $('#activosDisponiblesContainer').toggleClass('displayNone');
    $('#miCarteraContainer').toggleClass('displayNone'); */




  })

})