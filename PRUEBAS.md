# PRUEBAS – TP7 RutaSur

## 1. Consideraciones previas

El proyecto utiliza Docker Compose, Apache Kafka, MongoDB, Node.js y Next.js.

Si la memoria del equipo está comprometida, se recomienda ejecutar los consumidores de manera progresiva para evitar sobrecargar la computadora.

## 2. Preparación del entorno

Desde la carpeta raíz del proyecto, iniciar Kafka y MongoDB:

```bash
docker compose up -d kafka mongodb
```

Ejecutar los servicios de inicialización:

```bash
docker compose run --rm kafka-init
docker compose run --rm mongo-init
```

Comprobar el estado de los contenedores:

```bash
docker compose ps -a
```

## 3. Pruebas de consumidores

### 3.1. Notificaciones y reprogramación

Iniciar los servicios:

```bash
docker compose up -d --build notificaciones reprogramacion
```

Consultar los registros:

```bash
docker compose logs --tail=60 notificaciones reprogramacion
```

Ejecutar los escenarios:

```bash
cd simulador
node index.js ausente
node index.js tercer-fallo
cd ..
```

Verificar el procesamiento:

```bash
docker compose logs --tail=80 notificaciones reprogramacion
```

Si es necesario liberar recursos:

```bash
docker compose stop notificaciones reprogramacion
```

### 3.2. Monitor SLA y analítica

Iniciar los servicios:

```bash
docker compose up -d --build monitor-sla analitica
```

Consultar los registros:

```bash
docker compose logs --tail=50 monitor-sla analitica
```

Ejecutar el escenario demorado:

```bash
cd simulador
node index.js demorado
cd ..
```

Verificar las alertas y el procesamiento:

```bash
docker compose logs --tail=80 monitor-sla analitica
```

Si es necesario liberar recursos:

```bash
docker compose stop monitor-sla analitica
```

## 4. Reprocesamiento histórico

Consultar los valores existentes en MongoDB:

```bash
docker compose exec mongodb mongosh rutasur --quiet --eval "db.tiempos_hub.find({},{_id:0}).toArray()"
```

Iniciar el servicio:

```bash
docker compose --profile reprocesamiento up -d --build reprocesamiento
```

Consultar sus registros:

```bash
docker compose logs --tail=50 reprocesamiento
```

Reiniciar el consumidor:

```bash
docker compose restart reprocesamiento
```

Consultar nuevamente los datos:

```bash
docker compose exec mongodb mongosh rutasur --quiet --eval "db.tiempos_hub.find({},{_id:0}).toArray()"
```

Se verificó que el servicio genera registros de tiempos de permanencia en los hubs. Queda pendiente confirmar que un reinicio no duplique los acumulados.

## 5. Pruebas funcionales realizadas

### 5.1. Envío feliz

Se ejecutó el escenario de entrega exitosa.

**Resultado:** el envío alcanzó el estado ENTREGADO y se comprobó un historial de cinco eventos.

### 5.2. Destinatario ausente

Se simuló una entrega fallida por ausencia del destinatario.

**Resultado:** se comprobó la generación de una notificación y la reprogramación de la entrega.

### 5.3. Tercer fallo de entrega

Se ejecutó el escenario correspondiente al tercer intento fallido.

**Resultado:** se verificó el procesamiento de la devolución del envío.

### 5.4. Envío demorado

Se ejecutó el escenario de incumplimiento de tiempos de entrega.

**Resultado:** se observaron alertas SLA con severidades MEDIA, ALTA y CRÍTICA.

### 5.5. Ráfaga de 500 envíos

Se ejecutó el escenario de generación masiva.

**Resultado:** se comprobó la generación de 500 nuevos envíos.

### 5.6. Generación continua

Se ejecutó el escenario continuo.

**Resultado:** se observó el incremento de la cantidad de eventos procesados.

### 5.7. Dead Letter Queue (DLQ)

Se envió un evento inválido al sistema.

**Resultado:** el evento fue registrado en la DLQ junto con el error de validación y los datos de origen.

### 5.8. Eventos duplicados y fuera de orden

Se enviaron eventos duplicados y fuera de secuencia para un envío previamente entregado.

**Resultado:** el historial del envío permaneció sin modificaciones incorrectas.

### 5.9. Recuperación del consumidor de notificaciones

Se detuvo el servicio de notificaciones, se generó un nuevo evento y posteriormente se reinició el consumidor.

**Resultado:** se comprobó que el evento pendiente fue procesado y que se registró una notificación en MongoDB.

### 5.10. Persistencia en MongoDB

Se consultaron colecciones relacionadas con envíos, notificaciones y métricas.

**Resultado:** se verificó la existencia de registros generados por el procesamiento de eventos.

## 6. Verificación del frontend

Se accedió a las siguientes pantallas:

- `/`: torre de control con estados, alertas y envíos recientes.
- `/envios/ID_DEL_ENVIO`: detalle del envío e historial de eventos.
- `/tracking/ID_DEL_ENVIO`: seguimiento público del estado del envío.
- `/analitica`: indicadores, motivos de fallos, tiempos por hub y métricas.
- `/demo`: panel de escenarios de demostración.

**Resultado:** las pantallas se visualizaron correctamente y la sección de analítica mostró información almacenada en MongoDB.

## 7. Verificación de Docker Compose

Se ejecutó:

```bash
docker compose ps -a
```

**Resultado observado:**

- Kafka: en ejecución y saludable.
- MongoDB: en ejecución y saludable.
- Frontend: en ejecución.
- Proyector: en ejecución.
- Notificaciones: en ejecución.
- Reprogramación: en ejecución.
- Monitor SLA: en ejecución.
- Analítica: en ejecución.
- Reprocesamiento: en ejecución.
- Kafka-init y mongo-init: finalizados correctamente con código 0.

## 8. Verificaciones pendientes

Las siguientes comprobaciones no se consideran completamente validadas:

- Validar exhaustivamente las cuatro reglas SLA utilizando fechas controladas.
- Confirmar el cálculo del cumplimiento SLA cuando las promesas llegan después de otros eventos.
- Comprobar los controles de inicio y detención del escenario continuo desde la interfaz.
- Completar la verificación de actualizaciones en tiempo real mediante SSE.
- Verificar el arranque desde cero utilizando un único comando de Docker Compose.
- Confirmar que el reinicio del reprocesamiento histórico no duplica los acumulados.

## 9. Conclusión

Las pruebas realizadas permitieron comprobar el funcionamiento de los principales componentes de RutaSur: comunicación mediante Kafka, persistencia en MongoDB, procesamiento de eventos, generación de alertas, notificaciones, reprogramaciones, reprocesamiento histórico y visualización desde el frontend.

Los contenedores principales permanecieron en ejecución y las interfaces mostraron información procesada por el sistema.

Las verificaciones pendientes se encuentran identificadas para no presentar como comprobadas funcionalidades que todavía requieren pruebas adicionales.