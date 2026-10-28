
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      try {
        const respuesta = await fetch("/api/torre-control", {
          cache: "no-store",
        });

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar los datos");
        }

        const resultado = await respuesta.json();

        if (activo) {
          setDatos(resultado);
          setError("");
        }
      } catch (err) {
        if (activo) setError(err.message);
      }
    }

    cargarDatos();

    const eventos = new EventSource("/api/events");

    eventos.onmessage = (evento) => {
      try {
        const cambio = JSON.parse(evento.data);

        if (
          ["envios", "alertas", "notificaciones"].includes(
            cambio.coleccion
          )
        ) {
          cargarDatos();
        }
      } catch (err) {
        console.error("Error al procesar evento SSE:", err);
      }
    };

    return () => {
      activo = false;
      eventos.close();
    };
  }, []);

  function clasePrioridad(prioridad) {
    const valor = (prioridad || "").toUpperCase();

    if (valor === "CRITICA") return styles.critica;
    if (valor === "ALTA") return styles.alta;
    return styles.media;
  }

  if (error) {
    return (
      <main className={styles.contenedor}>
        <h2>Error al cargar los datos</h2>
        <p>{error}</p>
      </main>
    );
  }

  if (!datos) {
    return (
      <main className={styles.contenedor}>
        <p>Cargando datos...</p>
      </main>
    );
  }

  return (
    <main className={styles.contenedor}>
      <header className={styles.encabezado}>
        <div>
          <span className={styles.subtitulo}>
            PANEL DE OPERACIONES
          </span>
          <h1>RutaSur | Torre de control</h1>
          <p>Monitoreo de envíos y alertas logísticas</p>
        </div>
        <div className={styles.acciones}>
          <Link href="/analitica" className={styles.botonAnalitica}>
            Ver analítica
          </Link>

          <span className={styles.estadoSistema}>
            ● Monitoreo activo
          </span>
        </div>
      </header>

      <section className={styles.seccion}>
        <h2>Resumen de envíos</h2>

        <div className={styles.tarjetas}>
          {datos.contadores.map((item) => (
            <div
              key={item._id || "sin-estado"}
              className={styles.tarjeta}
            >
              <span className={styles.nombreEstado}>
                {item._id || "SIN ESTADO"}
              </span>
              <strong className={styles.cantidad}>
                {item.cantidad}
              </strong>
              <span className={styles.descripcion}>
                Envíos registrados
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.seccion}>
        <div className={styles.tituloSeccion}>
          <h2>Alertas logísticas</h2>
          <span>{datos.alertas.length} registros</span>
        </div>

        <div className={styles.tablaContenedor}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Envío</th>
                <th>Tipo de alerta</th>
                <th>Prioridad</th>
              </tr>
            </thead>
            <tbody>
              {datos.alertas.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    No hay alertas registradas.
                  </td>
                </tr>
              ) : (
                datos.alertas.map((alerta) => (
                  <tr key={String(alerta._id)}>
                    <td>{alerta.shipmentId || "-"}</td>
                    <td>{alerta.regla || "-"}</td>
                    <td>
                      <span
                        className={`${styles.etiqueta} ${clasePrioridad(
                          alerta.prioridad
                        )}`}
                      >
                        {alerta.prioridad || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.seccion}>
        <div className={styles.tituloSeccion}>
          <h2>Últimos movimientos</h2>
          <span>{datos.envios.length} envíos</span>
        </div>

        <div className={styles.tablaContenedor}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Número de seguimiento</th>
                <th>Estado actual</th>
                <th>Secuencia</th>
              </tr>
            </thead>
            <tbody>
              {datos.envios.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    No hay envíos registrados.
                  </td>
                </tr>
              ) : (
                datos.envios.map((envio) => (
                  <tr key={String(envio._id)}>
                    <td>
                      <Link
                        href={`/envios/${encodeURIComponent(
                          envio.shipmentId
                        )}`}
                        className={styles.enlace}
                      >
                        {envio.shipmentId}
                      </Link>
                    </td>
                    <td>
                      <span className={styles.estadoEnvio}>
                        {envio.estado || "-"}
                      </span>
                    </td>
                    <td>{envio.ultimaSecuencia ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
