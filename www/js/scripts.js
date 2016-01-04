		//http://www.javascriptlint.com/online_lint.php
		
		//Classe para emular o objeto de geolocalizacao
		function Position(latitude, longitude, altitude, accurary, altitudeAccuracy, heading, speed) {
			this.coords = function(latitude, longitude, altitude, accurary, altitudeAccuracy, heading, speed) {
				this.latitude = latitude;
				this.longitude = longitude;
				this.altitude = altitude;
				this.accuracy = accuracy;
				this.altitudeAccuracy = altitudeAccuracy;
				this.heading = heading;
				this.speed = speed;
			};
		}
		
		var Position2 = {
			coords : {
				latitude : "",
				longitude : "",
				altitude : "",
				accuracy : "",
				altitudeAccuracy : "",
				heading : "",
				speed : ""
			}
		};
		
		
		
		function rand(min,max,interval)	{
			if (typeof(interval)==='undefined') {
			interval = 1;
			}
			var r = Math.floor(Math.random()*(max-min+interval)/interval);
			return r*interval+min;
		}
		
		 function isNumberKey(evt) {
		 var charCode = (evt.which) ? evt.which : event.keyCode
		 if (charCode > 31 && (charCode < 48 || charCode > 57))
			return false;

		 return true;
		}
		
		function IsCEP(strCEP)  {
			if (strCEP.length<8){
				return false;
			}
			re = /#@?$%~|00000000|11111111|22222222|33333333|44444444|55555555|66666666|77777777|88888888|99999999/gi;
			if(re.test(strCEP)){
				return false;
			}else{
				return true;
			}
		}
		
		
		
		//Funcoes especificas do Phonegap
		
		var celular_modelo = "";	
		var celular_plataforma = "";
		var celular_uuid = "";
		var celular_versao = "";
		var isPhoneGapReady = true;
		var isConnected = true;
		var isHighSpeed = false;
		var status_bateria = "aguarde...";
		var watchID;
		var retorno_rastreio = "(nao houve o envio de dados)";
		
		//Variaveis da aplicacao
		var email_aplicativo;
		var var_chave;
		var CEP;
		var tmp_resultado  = "";
		var tmp_resultado_txt  = "";
		var tmp_uf  = "";
		var tmp_cidade  = "";
		var tmp_bairro  = "";
		var tmp_tipo_logradouro  = "";
		var tmp_logradouro  = "";
		var tmp_endereco_completo = "";
		var endereco_formatado = "";
		
		// Wait for device API libraries to load
		// device APIs are available
		//
		
		document.addEventListener("deviceready", onDeviceReady, false);
		 
		function onDeviceReady() {
			
			isPhoneGapReady = true;
			// detect for network access
			networkDetection();
			// attach events for online and offline detection
			document.addEventListener("online", onOnline, false);
			document.addEventListener("offline", onOffline, false);
			document.addEventListener("batterystatus", onBatteryStatus, false);
			
			
		}
		
		 // alert dialog dismissed
		function alertDismissed() {
			// do something
		}
		
		
		
		
		function networkDetection() {
			if (isPhoneGapReady) {
				// as long as the connection type is not none,
				// the device should have Internet access
				
				isConnected = true;
				isHighSpeed = true;
				//O codigo abaixo somente funciona no dispositivo
				//if (navigator.network.connection.type != Connection.NONE) {
				//	isConnected = true;
				//}
				// determine whether this connection is high-speed
				//switch (navigator.network.connection.type) {
				//	case Connection.UNKNOWN:
				//	case Connection.CELL_2G:
				//	isHighSpeed = false;
				//	break;
				//	default:
				//	isHighSpeed = true;
				//	break;
				//}
			}
		}
		
		function onOnline() {
			isConnected = true;
		}
		function onOffline() {
			isConnected = false;
		}
		
		function onBatteryStatus(battery_info) {
			status_bateria = battery_info.level + '%';
		}
		
			
		
		$(document).on('pageshow', '#posicao', function(){ 
			if (isPhoneGapReady){
				if (isConnected) {
					PesquisarCEP(CEP);
					initialize_mapa();
				} else {
					navigator.notification.alert('Não existe conexão com a Internet', alertDismissed, 'Consulta CEP', 'OK');
					$.mobile.changePage("#pageone");
				}
			} else {
				navigator.notification.alert('O aplicativo não está pronto!', alertDismissed, 'Consulta CEP', 'OK');
				$.mobile.changePage("#pageone");
			}
		});
		
		
		$(document).on('pageinit', '#pageone', function(){ 
		
			var_chave = rand(1000,9999,1);
		
			$(document).on('click', '#enviar_contato', function() { // catch the form's submit event
			
				var continuar = true;
				var mensagem ="Ocorreram os seguintes erros:\n";
				
				if ($('#cep').val() == "") {
					mensagem = mensagem +  'Digite o CEP\n';
					continuar = false;
				} else {
					if (IsCEP($('#cep').val())){
						//Nao faz nada
					} else{
						mensagem = mensagem +  'O CEP foi digitado de forma incorreta\n';
						continuar = false;
					}
				}
				
				if (continuar){
					CEP = $('#cep').val();
					$("#resultadoCEP").html('');
					endereco_formatado = "";
					$.mobile.changePage("#posicao");
				} else {
					alert(mensagem);
					//navigator.notification.alert(mensagem, alertDismissed, 'Consulta CEP', 'OK');
				}
				return false; // cancel original event to prevent form submitting
		 
			});
		});
		
		
		//Funcoes para montar o mapa
		var map, geocoder;
		var mapDisplay, directionsService;

		function initialize_mapa() {
		  var myOptions = {zoom: 15,mapTypeId: google.maps.MapTypeId.ROADMAP};
		  map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);
		  geocoder = new google.maps.Geocoder();
		  
		  //var enderDe = 'ALAMEDA SANTOS, 1000, SAO PAULO - SP, 01418-9028';
		  var enderDe = tmp_endereco_completo;
		  geocoder.geocode( { 'address': enderDe, 'region' : 'BR'},trataLocs);
		  
		}

		function trataLocs (results, status) {
		  var elem = document.getElementById('msg');
		  if (status == google.maps.GeocoderStatus.OK) {
		   map.setCenter(results[0].geometry.location);
		  var marker = new google.maps.Marker({
		  map: map, 
		  position: results[0].geometry.location  });
		  if (results.length > 1) {
		   var i, txt = '<select style="font-family:Verdana;font-size:8pt;width=550px;" onchange="mostraEnd(this.options[this.selectedIndex].text);">';
		   elem.innerHTML = 'O endereço exato não foi localizado - há ' +  results.length.toString() + ' resultados aproximados.<br />';
		   for (i = 0; i < results.length; i++) {
		   txt = txt + '<option value="' + i.toString() + '"';
			if (i == 0) {
				txt = txt + ' selected="selected"'; 
				txt = txt + '>' + results[i].formatted_address + '</option>';
			}
			}
		  txt = txt + '</select>';
		   elem.innerHTML = elem.innerHTML + txt;
		   }
		  } else {
		   elem.innerHTML = 'Erro no tratamento do endereço :<br /><b>' + status + '</b>';
		 }
		 
		} 
		
		//Programacao para puxar o CEP
		
		
		function PesquisarCEP(CEP){
			$.ajax({
			type: "GET",
			url: "http://cep.republicavirtual.com.br/web_cep.php?cep=" + CEP + "&formato=xml",
			dataType: "xml",
			success: function(data) {
				
				$(data).find('webservicecep').each(function(){
					
					tmp_resultado  = $(this).find("resultado").text();
					tmp_resultado_txt  = $(this).find("resultado_txt").text();
					tmp_uf  = $(this).find("uf").text();
					tmp_cidade  = $(this).find("cidade").text();
					tmp_bairro  = $(this).find("bairro").text();
					tmp_tipo_logradouro  = $(this).find("tipo_logradouro").text();
					tmp_logradouro  = $(this).find("logradouro").text();
					
					tmp_endereco_completo = tmp_tipo_logradouro + " " + tmp_logradouro + ", 10, " + tmp_cidade + " - " + tmp_uf + "," + CEP;
					
					
					
					endereco_formatado += "Tipo logradouro: " + tmp_tipo_logradouro + "<br/>";
					endereco_formatado += "Logradouro: " + tmp_logradouro+ "<br/>";
					endereco_formatado += "Bairro: " + tmp_bairro+ "<br/>";
					endereco_formatado += "Cidade: " + tmp_cidade+ "<br/>";
					endereco_formatado += "Estado: " + tmp_uf + "<br/>";
					$("#resultadoCEP").html(endereco_formatado);
					
				});
				
				
				},
				error: function(xhr, status, error) {
					endereco_formatado = 'Houve um problema ao pesquisar o CEP informado';
					$("#resultadoCEP").html(endereco_formatado);
				 }
			});
		}
		