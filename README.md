# FlightApp (FlyNow)

Proyecto de reservas de vuelos con:

- Backend Java con Spring Boot y Maven.
- Frontend estatico (HTML) servido con Apache Tomcat 11.

## Requisitos

- Java 17
- Maven 3.9+
- MySQL 8+
- Apache Tomcat 11
- PowerShell (Windows)

## Iniciar backend

Se incluye el script `start-backend.ps1` en la raiz del proyecto. Este script:

- Lanza el backend con Maven (`spring-boot:run`).
- Usa por defecto el puerto `8081` para evitar conflicto con Tomcat en `8080`.
- Abre el navegador en `http://localhost:8081/`.

1. Configura tus propiedades privadas en:

	- `backend/resources/application-private.properties`

2. Desde la raiz del proyecto, ejecuta:

	```powershell
	.\start-backend.ps1
	```

Opcionalmente puedes cambiar el puerto:

	```powershell
	.\start-backend.ps1 -Port 8082
	```

Si no quieres abrir el navegador automaticamente:

	```powershell
	.\start-backend.ps1 -NoBrowser
	```

El backend quedara disponible en `http://localhost:8081` (o en el puerto que indiques).

Rutas iniciales disponibles tras arrancar:

- `http://localhost:8081/` devuelve un JSON basico de estado.
- `http://localhost:8081/api/health` devuelve `{ "status": "UP" }`.

## Iniciar frontend con Tomcat 11

Se incluye el script `start-frontend-tomcat.ps1` en la raiz del proyecto. Este script:

- Copia `frontend/public/busquedaVuelos.html` como `index.html` dentro de `webapps/ROOT` de Tomcat.
- Inicia Tomcat si no esta ya en ejecucion.
- Abre el navegador en `http://localhost:8080/`.

1. Define la ruta de Tomcat (una sola vez por sesion de PowerShell):

	```powershell
	$env:TOMCAT_HOME = "C:\ruta\a\apache-tomcat-11"
	```

2. Desde la raiz del proyecto, ejecuta:

	```powershell
	.\start-frontend-tomcat.ps1 -TomcatHome $env:TOMCAT_HOME
	```

Tambien puedes pasar una ruta relativa desde la raiz de `flightApp`, por ejemplo:

	```powershell
	.\start-frontend-tomcat.ps1 -TomcatHome .\apache-tomcat-11
	```

3. Para detener Tomcat:

	```powershell
	& "$env:TOMCAT_HOME\bin\shutdown.bat"
	```

## Notas

- Si ya usas `CATALINA_HOME`, el script tambien lo toma automaticamente.
- Si Tomcat ya estaba levantado en el puerto 8080, el script vuelve a copiar la pagina y abre el navegador.
- Si tienes otro servicio ocupando el 8080, libera ese puerto o cambia el puerto HTTP de Tomcat en `conf/server.xml`.


